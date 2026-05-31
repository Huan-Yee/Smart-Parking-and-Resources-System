/**
 * esp32cam_parking.ino
 * MMU Smart Parking System — ESP32-CAM MJPEG Stream Server
 * =========================================================
 *
 * PURPOSE
 * -------
 * This sketch turns the AI Thinker ESP32-CAM into a lightweight MJPEG
 * streaming server.  The Python CV engine (main.py) connects to the stream
 * URL and performs all motion detection and event reporting on the laptop.
 *
 * The ESP32-CAM itself does NO detection, NO license plate recognition, and
 * NO direct backend communication.  Its sole job is to stream video frames
 * over Wi-Fi as fast and stably as possible.
 *
 * ALPR DISCLAIMER
 * ---------------
 * Current ESP32-CAM resolution (QVGA 320×240) is used only for
 * motion / vehicle-passing detection.  License plate recognition
 * is NOT attempted and NOT possible at this resolution.
 * ALPR is a documented future improvement requiring higher-resolution
 * cameras (e.g. 1080p IP cameras) or dedicated edge-AI hardware.
 *
 * HARDWARE
 * --------
 * Board  : AI Thinker ESP32-CAM
 * Camera : OV2640 (bundled)
 *
 * ARDUINO IDE SETUP (do this once per machine)
 * --------------------------------------------
 * 1. Open Arduino IDE → File → Preferences
 * 2. Paste into "Additional boards manager URLs":
 *      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 * 3. Tools → Board → Board Manager → search "esp32" →
 *    install "esp32 by Espressif Systems" (version 2.x recommended)
 * 4. Tools → Board → ESP32 Arduino → AI Thinker ESP32-CAM
 * 5. Tools → Upload Speed → 115200
 * 6. Tools → Port → select the USB-to-serial adapter port
 *    (AI Thinker board has no built-in USB — use an FTDI/CP2102 adapter)
 *
 * UPLOAD WIRING (FTDI adapter)
 * ----------------------------
 * ESP32-CAM  |  FTDI adapter
 * -----------|---------------
 * GND        |  GND
 * 5V         |  VCC (5V)
 * U0R (RX0)  |  TX
 * U0T (TX0)  |  RX
 * IO0        |  GND  ← pull LOW to enter flash mode
 *
 * After upload: remove IO0–GND jumper, press RST button.
 *
 * HOW TO FIND THE ESP32-CAM IP ADDRESS
 * -------------------------------------
 * 1. Open Tools → Serial Monitor (115200 baud)
 * 2. Press the RST button on the ESP32-CAM
 * 3. Watch for: "Camera Ready! Stream URL: http://192.168.x.x:81/stream"
 * 4. Copy that IP into cv-engine/.env as ENTRY_CAMERA_URL or EXIT_CAMERA_URL
 * 5. Test in a browser: http://192.168.x.x:81/stream — you should see live video
 *
 * MOBILE HOTSPOT NOTES
 * --------------------
 * - Both ESP32-CAMs and the laptop must connect to the SAME hotspot.
 * - Keep the phone plugged in — streaming drains battery quickly.
 * - The ESP32-CAM IP may change after every hotspot reconnect.
 *   Always re-check Serial Monitor before a field test session.
 * - Test the stream URL in a browser BEFORE starting the CV engine.
 *
 * CONFIGURATION
 * -------------
 * Edit the three lines in the CONFIGURATION SECTION below before uploading:
 *   WIFI_SSID      — your hotspot network name
 *   WIFI_PASSWORD  — your hotspot password
 *   CAMERA_ROLE    — "ENTRY" or "EXIT" (for Serial Monitor identification only)
 */

// =============================================================================
// CONFIGURATION SECTION — edit these before uploading
// =============================================================================

#define WIFI_SSID      "YOUR_HOTSPOT_SSID"      // ← replace with your hotspot name
#define WIFI_PASSWORD  "YOUR_HOTSPOT_PASSWORD"   // ← replace with your hotspot password
#define CAMERA_ROLE    "ENTRY"                   // ← "ENTRY" or "EXIT" (label only)

// Camera resolution — choose ONE:
//   FRAMESIZE_QVGA  (320×240)  — recommended: stable over Wi-Fi, sufficient for detection
//   FRAMESIZE_VGA   (640×480)  — optional: more detail, may be unstable on weak hotspot
//   FRAMESIZE_SVGA  (800×600)  — not recommended for prototype
#define CAMERA_FRAMESIZE  FRAMESIZE_QVGA

// JPEG quality: 0 (worst/fastest) – 63 (best/slowest).
// 10–15 is the sweet spot: good image, adequate FPS.
#define JPEG_QUALITY  12

// =============================================================================
// END CONFIGURATION — do not edit below unless you know what you are doing
// =============================================================================

#include "esp_camera.h"
#include "esp_http_server.h"
#include <WiFi.h>

// ---------------------------------------------------------------------------
// AI Thinker ESP32-CAM pin map
// (Do not modify — specific to the AI Thinker hardware layout)
// ---------------------------------------------------------------------------
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ---------------------------------------------------------------------------
// MJPEG stream handler
// ---------------------------------------------------------------------------
#define PART_BOUNDARY "123456789000000000000987654321"
static const char *_STREAM_CONTENT_TYPE =
    "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char *_STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char *_STREAM_PART =
    "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t stream_httpd = NULL;

static esp_err_t stream_handler(httpd_req_t *req) {
    camera_fb_t *fb = NULL;
    esp_err_t res = ESP_OK;
    size_t _jpg_buf_len = 0;
    uint8_t *_jpg_buf = NULL;
    char part_buf[128];

    res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
    if (res != ESP_OK) return res;

    // Disable response buffering for real-time streaming
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    while (true) {
        fb = esp_camera_fb_get();
        if (!fb) {
            Serial.println("[WARN] Camera capture failed");
            res = ESP_FAIL;
            break;
        }

        if (fb->format != PIXFORMAT_JPEG) {
            bool jpeg_converted = frame2jpg(fb, JPEG_QUALITY, &_jpg_buf, &_jpg_buf_len);
            esp_camera_fb_return(fb);
            fb = NULL;
            if (!jpeg_converted) {
                Serial.println("[WARN] JPEG conversion failed");
                res = ESP_FAIL;
                break;
            }
        } else {
            _jpg_buf_len = fb->len;
            _jpg_buf = fb->buf;
        }

        // Send multipart boundary
        if (res == ESP_OK) {
            res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
        }
        // Send part header
        if (res == ESP_OK) {
            size_t hlen = snprintf((char *)part_buf, 128, _STREAM_PART, _jpg_buf_len);
            res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
        }
        // Send JPEG data
        if (res == ESP_OK) {
            res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
        }

        // Clean up
        if (fb) {
            esp_camera_fb_return(fb);
            fb = NULL;
            _jpg_buf = NULL;
        } else if (_jpg_buf) {
            free(_jpg_buf);
            _jpg_buf = NULL;
        }

        if (res != ESP_OK) break;
    }
    return res;
}

// ---------------------------------------------------------------------------
// Start streaming HTTP server on port 81
// ---------------------------------------------------------------------------
void startStreamServer() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 81;

    httpd_uri_t stream_uri = {
        .uri       = "/stream",
        .method    = HTTP_GET,
        .handler   = stream_handler,
        .user_ctx  = NULL
    };

    if (httpd_start(&stream_httpd, &config) == ESP_OK) {
        httpd_register_uri_handler(stream_httpd, &stream_uri);
        Serial.println("[OK] Stream server started on port 81");
    } else {
        Serial.println("[ERROR] Failed to start stream server");
    }
}

// ---------------------------------------------------------------------------
// Camera initialisation
// ---------------------------------------------------------------------------
bool initCamera() {
    camera_config_t cam_config;

    cam_config.ledc_channel  = LEDC_CHANNEL_0;
    cam_config.ledc_timer     = LEDC_TIMER_0;
    cam_config.pin_d0         = Y2_GPIO_NUM;
    cam_config.pin_d1         = Y3_GPIO_NUM;
    cam_config.pin_d2         = Y4_GPIO_NUM;
    cam_config.pin_d3         = Y5_GPIO_NUM;
    cam_config.pin_d4         = Y6_GPIO_NUM;
    cam_config.pin_d5         = Y7_GPIO_NUM;
    cam_config.pin_d6         = Y8_GPIO_NUM;
    cam_config.pin_d7         = Y9_GPIO_NUM;
    cam_config.pin_xclk       = XCLK_GPIO_NUM;
    cam_config.pin_pclk       = PCLK_GPIO_NUM;
    cam_config.pin_vsync      = VSYNC_GPIO_NUM;
    cam_config.pin_href       = HREF_GPIO_NUM;
    cam_config.pin_sscb_sda   = SIOD_GPIO_NUM;
    cam_config.pin_sscb_scl   = SIOC_GPIO_NUM;
    cam_config.pin_pwdn       = PWDN_GPIO_NUM;
    cam_config.pin_reset      = RESET_GPIO_NUM;
    cam_config.xclk_freq_hz   = 20000000;       // 20 MHz
    cam_config.pixel_format   = PIXFORMAT_JPEG;

    // Frame size from CONFIGURATION SECTION above
    cam_config.frame_size     = CAMERA_FRAMESIZE;
    cam_config.jpeg_quality   = JPEG_QUALITY;
    cam_config.fb_count       = 2;              // Double buffer for smoother streaming

    esp_err_t err = esp_camera_init(&cam_config);
    if (err != ESP_OK) {
        Serial.printf("[ERROR] Camera init failed: 0x%x\n", err);
        return false;
    }

    // Optional image adjustments (comment out if not needed)
    sensor_t *s = esp_camera_sensor_get();
    if (s) {
        s->set_brightness(s, 0);    // -2 to 2
        s->set_contrast(s, 0);      // -2 to 2
        s->set_saturation(s, 0);    // -2 to 2
        s->set_whitebal(s, 1);      // 0 = disable, 1 = enable auto white balance
        s->set_awb_gain(s, 1);      // 0 = disable, 1 = enable AWB gain
        s->set_exposure_ctrl(s, 1); // 0 = disable, 1 = enable AEC
        s->set_aec2(s, 0);          // 0 = disable, 1 = enable AEC DSP
        s->set_gain_ctrl(s, 1);     // 0 = disable, 1 = enable AGC
        s->set_gainceiling(s, (gainceiling_t)2); // 0 to 6
        s->set_lenc(s, 1);          // Lens correction
        s->set_hmirror(s, 0);       // Horizontal mirror (1 = flip)
        s->set_vflip(s, 0);         // Vertical flip (1 = flip)
    }

    return true;
}

// ---------------------------------------------------------------------------
// setup()
// ---------------------------------------------------------------------------
void setup() {
    Serial.begin(115200);
    Serial.setDebugOutput(false);
    Serial.println();
    Serial.println("==============================================");
    Serial.println(" MMU Smart Parking — ESP32-CAM Stream Server");
    Serial.printf(" Role: %s\n", CAMERA_ROLE);
    Serial.println("==============================================");

    // Initialise camera
    if (!initCamera()) {
        Serial.println("[FATAL] Camera init failed. Check wiring. Halting.");
        while (true) delay(1000);
    }
    Serial.println("[OK] Camera initialised.");

    // Connect to Wi-Fi hotspot
    Serial.printf("[WiFi] Connecting to: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    WiFi.setSleep(false); // Disable Wi-Fi power saving for stable streaming

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        attempts++;
        if (attempts > 40) {  // 20 seconds timeout
            Serial.println();
            Serial.println("[ERROR] Wi-Fi connection failed. Check SSID/password.");
            Serial.println("        Restarting in 5 seconds...");
            delay(5000);
            ESP.restart();
        }
    }
    Serial.println();
    Serial.println("[OK] Wi-Fi connected.");
    Serial.printf("[OK] IP Address: %s\n", WiFi.localIP().toString().c_str());

    // Start MJPEG stream server
    startStreamServer();

    // Print the stream URL — copy this into cv-engine/.env
    Serial.println();
    Serial.println("----------------------------------------------");
    Serial.printf(" Camera Ready! [%s]\n", CAMERA_ROLE);
    Serial.printf(" Stream URL: http://%s:81/stream\n",
                  WiFi.localIP().toString().c_str());
    Serial.println(" Copy this URL into cv-engine/.env");
    Serial.println("----------------------------------------------");
}

// ---------------------------------------------------------------------------
// loop() — nothing to do; HTTP server runs on its own task
// ---------------------------------------------------------------------------
void loop() {
    // Wi-Fi watchdog: restart if connection drops
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WARN] Wi-Fi lost. Reconnecting...");
        WiFi.reconnect();
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(500);
            Serial.print(".");
            attempts++;
        }
        Serial.println();
        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("[OK] Reconnected. IP: %s\n",
                          WiFi.localIP().toString().c_str());
        } else {
            Serial.println("[ERROR] Reconnect failed. Restarting...");
            ESP.restart();
        }
    }
    delay(5000); // Check every 5 seconds
}

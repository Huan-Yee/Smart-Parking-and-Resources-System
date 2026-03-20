import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { EventsService } from './events/events.service';
import { SetCountDto } from './events/dto/set-count.dto';

@Controller()
export class AppController {
    constructor(private readonly eventsService: EventsService) { }

    /**
     * Admin Dashboard - Simple HTML Page
     */
    @Get()
    async getAdminDashboard(@Res() res: Response) {
        const stats = await this.eventsService.getStats();
        const history = await this.eventsService.getHistory(10);

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Admin - MMU Smart Parking</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        h1 { margin-bottom: 5px; }
        table { border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
        th { background: #eee; }
        a { color: blue; }
        button { padding: 8px 16px; margin: 5px; cursor: pointer; }
        .reset { background: #ff6b6b; color: white; border: none; }
        .refresh { background: #4dabf7; color: white; border: none; }
        hr { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🚗 MMU Smart Parking - Admin</h1>
    <p>Backend Control Panel</p>
    <hr>

    <h2>📊 Current Stats</h2>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Capacity</td><td>${stats.total}</td></tr>
        <tr><td>Occupied</td><td>${stats.occupied}</td></tr>
        <tr><td>Available</td><td>${stats.available}</td></tr>
    </table>

    <h2>🔗 API Endpoints</h2>
    <table>
        <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
        <tr><td>GET</td><td><a href="/events/stats">/events/stats</a></td><td>Current occupancy</td></tr>
        <tr><td>GET</td><td><a href="/events/history">/events/history</a></td><td>Recent events</td></tr>
        <tr><td>POST</td><td>/events/entry</td><td>Record entry (CV Engine)</td></tr>
        <tr><td>POST</td><td>/events/exit</td><td>Record exit (CV Engine)</td></tr>
        <tr><td>POST</td><td>/admin/set-count</td><td>Set occupied count (Admin)</td></tr>
    </table>

    <h2>📋 Recent Events (Last 10)</h2>
    <table>
        <tr><th>Type</th><th>Plate</th><th>Time</th></tr>
        ${history.length === 0 ? '<tr><td colspan="3">No events yet</td></tr>' :
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (history as any[]).map((e) =>
                    `<tr>
                <td>${e.type || 'N/A'}</td>
                <td>${e.licensePlate || 'N/A'}</td>
                <td>${e.timestamp?.toDate?.() ? new Date(e.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
            </tr>`
                ).join('')}
    </table>

    <h2>⚡ Actions</h2>
    <button class="refresh" onclick="location.reload()">🔄 Refresh</button>
    <div style="margin-top: 10px;">
        <label>Set occupied count: </label>
        <input type="number" id="countInput" min="0" max="30" value="0" style="width: 60px; padding: 6px;">
        <button class="reset" onclick="setCount()">📝 Set Count</button>
    </div>

    <hr>
    <p>Frontend Dashboard: <a href="http://localhost:3000/dashboard">localhost:3000/dashboard</a></p>

    <script>
        async function setCount() {
            const count = parseInt(document.getElementById('countInput').value);
            if (isNaN(count) || count < 0 || count > 30) {
                alert('Please enter a number between 0 and 30');
                return;
            }
            if (!confirm('Set occupied count to ' + count + '?')) return;
            const res = await fetch('/admin/set-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ occupied: count }),
            });
            const data = await res.json();
            alert(data.message || 'Done');
            location.reload();
        }
    </script>
</body>
</html>
    `;

        res.type('text/html').send(html);
    }

    /**
     * Admin: Manually set the occupancy count
     */
    @Post('admin/set-count')
    async setCount(@Body() setCountDto: SetCountDto) {
        return this.eventsService.setCount(setCountDto);
    }
}

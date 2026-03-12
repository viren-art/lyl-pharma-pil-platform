import { TFDAMonitorService } from '../services/monitoring/tfda/tfda-monitor.service';
import { FDAThailandMonitorService } from '../services/monitoring/fda-thailand/fda-thailand-monitor.service';
import { DAVMonitorService } from '../services/monitoring/dav/dav-monitor.service';
import { logger } from '../utils/logger';

/**
 * Start all regulatory announcement monitors
 * Run as background service: node dist/scripts/start-monitors.js
 */
async function startMonitors() {
  logger.info('Starting regulatory announcement monitors');

  const tfdaMonitor = new TFDAMonitorService();
  const fdaThailandMonitor = new FDAThailandMonitorService();
  const davMonitor = new DAVMonitorService();

  // Start polling for all authorities
  await tfdaMonitor.startPolling();
  await fdaThailandMonitor.startPolling();
  await davMonitor.startPolling();

  logger.info('All monitors started successfully');

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping monitors');
    tfdaMonitor.stopPolling();
    fdaThailandMonitor.stopPolling();
    davMonitor.stopPolling();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping monitors');
    tfdaMonitor.stopPolling();
    fdaThailandMonitor.stopPolling();
    davMonitor.stopPolling();
    process.exit(0);
  });
}

startMonitors().catch((error) => {
  logger.error('Failed to start monitors', { error });
  process.exit(1);
});
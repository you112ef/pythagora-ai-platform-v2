const os = require('os');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.initializeMetrics();
  }

  initializeMetrics() {
    // System metrics
    this.metrics.set('cpu_usage', {
      name: 'CPU Usage',
      type: 'percentage',
      unit: '%',
      threshold: 80,
      critical: 95
    });

    this.metrics.set('memory_usage', {
      name: 'Memory Usage',
      type: 'percentage',
      unit: '%',
      threshold: 85,
      critical: 95
    });

    this.metrics.set('disk_usage', {
      name: 'Disk Usage',
      type: 'percentage',
      unit: '%',
      threshold: 90,
      critical: 95
    });

    this.metrics.set('network_io', {
      name: 'Network I/O',
      type: 'bytes',
      unit: 'bytes/sec',
      threshold: 1000000, // 1MB/s
      critical: 10000000 // 10MB/s
    });

    // Application metrics
    this.metrics.set('response_time', {
      name: 'Response Time',
      type: 'time',
      unit: 'ms',
      threshold: 1000,
      critical: 5000
    });

    this.metrics.set('error_rate', {
      name: 'Error Rate',
      type: 'percentage',
      unit: '%',
      threshold: 5,
      critical: 10
    });

    this.metrics.set('request_count', {
      name: 'Request Count',
      type: 'counter',
      unit: 'requests',
      threshold: 1000,
      critical: 10000
    });

    this.metrics.set('active_connections', {
      name: 'Active Connections',
      type: 'gauge',
      unit: 'connections',
      threshold: 100,
      critical: 500
    });
  }

  async collectMetrics(metrics = [], alerts = []) {
    const results = {};
    const collectedAlerts = [];

    try {
      // Collect system metrics
      if (metrics.includes('cpu_usage') || metrics.length === 0) {
        results.cpu_usage = await this.getCPUUsage();
        if (this.checkThreshold('cpu_usage', results.cpu_usage)) {
          collectedAlerts.push(this.createAlert('cpu_usage', results.cpu_usage));
        }
      }

      if (metrics.includes('memory_usage') || metrics.length === 0) {
        results.memory_usage = await this.getMemoryUsage();
        if (this.checkThreshold('memory_usage', results.memory_usage)) {
          collectedAlerts.push(this.createAlert('memory_usage', results.memory_usage));
        }
      }

      if (metrics.includes('disk_usage') || metrics.length === 0) {
        results.disk_usage = await this.getDiskUsage();
        if (this.checkThreshold('disk_usage', results.disk_usage)) {
          collectedAlerts.push(this.createAlert('disk_usage', results.disk_usage));
        }
      }

      if (metrics.includes('network_io') || metrics.length === 0) {
        results.network_io = await this.getNetworkIO();
        if (this.checkThreshold('network_io', results.network_io)) {
          collectedAlerts.push(this.createAlert('network_io', results.network_io));
        }
      }

      // Collect application metrics
      if (metrics.includes('response_time') || metrics.length === 0) {
        results.response_time = await this.getResponseTime();
        if (this.checkThreshold('response_time', results.response_time)) {
          collectedAlerts.push(this.createAlert('response_time', results.response_time));
        }
      }

      if (metrics.includes('error_rate') || metrics.length === 0) {
        results.error_rate = await this.getErrorRate();
        if (this.checkThreshold('error_rate', results.error_rate)) {
          collectedAlerts.push(this.createAlert('error_rate', results.error_rate));
        }
      }

      if (metrics.includes('request_count') || metrics.length === 0) {
        results.request_count = await this.getRequestCount();
        if (this.checkThreshold('request_count', results.request_count)) {
          collectedAlerts.push(this.createAlert('request_count', results.request_count));
        }
      }

      if (metrics.includes('active_connections') || metrics.length === 0) {
        results.active_connections = await this.getActiveConnections();
        if (this.checkThreshold('active_connections', results.active_connections)) {
          collectedAlerts.push(this.createAlert('active_connections', results.active_connections));
        }
      }

      // Process alerts
      if (alerts.length > 0) {
        for (const alert of collectedAlerts) {
          await this.processAlert(alert, alerts);
        }
      }

      return {
        success: true,
        timestamp: new Date(),
        metrics: results,
        alerts: collectedAlerts,
        system: {
          platform: os.platform(),
          arch: os.arch(),
          uptime: os.uptime(),
          hostname: os.hostname()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getCPUUsage() {
    try {
      const { stdout } = await execAsync('top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | awk -F\'%\' \'{print $1}\'');
      return parseFloat(stdout.trim()) || 0;
    } catch (error) {
      // Fallback to Node.js os module
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      return 100 - ~~(100 * totalIdle / totalTick);
    }
  }

  async getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return (usedMem / totalMem) * 100;
  }

  async getDiskUsage() {
    try {
      const { stdout } = await execAsync('df -h / | awk \'NR==2{print $5}\' | sed \'s/%//\'');
      return parseFloat(stdout.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  async getNetworkIO() {
    try {
      const { stdout } = await execAsync('cat /proc/net/dev | grep eth0 | awk \'{print $2+$10}\'');
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  async getResponseTime() {
    // This would typically be collected from application logs or metrics
    // For now, return a simulated value
    return Math.random() * 1000;
  }

  async getErrorRate() {
    // This would typically be calculated from application logs
    // For now, return a simulated value
    return Math.random() * 10;
  }

  async getRequestCount() {
    // This would typically be collected from application metrics
    // For now, return a simulated value
    return Math.floor(Math.random() * 1000);
  }

  async getActiveConnections() {
    try {
      const { stdout } = await execAsync('netstat -an | grep :3000 | grep ESTABLISHED | wc -l');
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  checkThreshold(metricName, value) {
    const metric = this.metrics.get(metricName);
    if (!metric) return false;

    return value > metric.threshold;
  }

  createAlert(metricName, value) {
    const metric = this.metrics.get(metricName);
    const severity = value > metric.critical ? 'critical' : 'warning';

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric: metricName,
      value,
      threshold: metric.threshold,
      severity,
      message: `${metric.name} is ${value}${metric.unit} (threshold: ${metric.threshold}${metric.unit})`,
      timestamp: new Date()
    };
  }

  async processAlert(alert, alertConfigs) {
    for (const config of alertConfigs) {
      if (config.metrics.includes(alert.metric)) {
        switch (config.type) {
          case 'email':
            await this.sendEmailAlert(alert, config);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, config);
            break;
          case 'log':
            await this.logAlert(alert, config);
            break;
          case 'notification':
            await this.sendNotification(alert, config);
            break;
        }
      }
    }
  }

  async sendEmailAlert(alert, config) {
    // Implementation would send email notification
    console.log(`Email Alert: ${alert.message}`);
  }

  async sendWebhookAlert(alert, config) {
    // Implementation would send webhook notification
    console.log(`Webhook Alert: ${alert.message}`);
  }

  async logAlert(alert, config) {
    // Implementation would log the alert
    console.log(`Log Alert: ${alert.message}`);
  }

  async sendNotification(alert, config) {
    // Implementation would send push notification
    console.log(`Notification Alert: ${alert.message}`);
  }

  // Health check methods
  async getSystemHealth() {
    const metrics = await this.collectMetrics();
    
    const health = {
      status: 'healthy',
      checks: {
        cpu: this.getHealthStatus('cpu_usage', metrics.metrics.cpu_usage),
        memory: this.getHealthStatus('memory_usage', metrics.metrics.memory_usage),
        disk: this.getHealthStatus('disk_usage', metrics.metrics.disk_usage),
        network: this.getHealthStatus('network_io', metrics.metrics.network_io)
      }
    };

    // Determine overall health status
    const checkStatuses = Object.values(health.checks);
    if (checkStatuses.includes('critical')) {
      health.status = 'critical';
    } else if (checkStatuses.includes('warning')) {
      health.status = 'warning';
    }

    return health;
  }

  getHealthStatus(metricName, value) {
    const metric = this.metrics.get(metricName);
    if (!metric) return 'unknown';

    if (value > metric.critical) return 'critical';
    if (value > metric.threshold) return 'warning';
    return 'healthy';
  }

  // Performance monitoring
  async getPerformanceMetrics() {
    const startTime = Date.now();
    
    const metrics = await this.collectMetrics();
    const health = await this.getSystemHealth();
    
    const collectionTime = Date.now() - startTime;
    
    return {
      ...metrics,
      health,
      collectionTime,
      timestamp: new Date()
    };
  }

  // Custom metrics
  async addCustomMetric(name, value, type = 'gauge', unit = '') {
    this.metrics.set(name, {
      name,
      type,
      unit,
      threshold: null,
      critical: null
    });

    return {
      success: true,
      metric: name,
      value,
      timestamp: new Date()
    };
  }

  async setMetricThreshold(metricName, threshold, critical = null) {
    const metric = this.metrics.get(metricName);
    if (!metric) {
      return {
        success: false,
        error: 'Metric not found'
      };
    }

    metric.threshold = threshold;
    if (critical !== null) {
      metric.critical = critical;
    }

    return {
      success: true,
      metric: metricName,
      threshold,
      critical: metric.critical
    };
  }

  // Alert management
  async createAlertRule(rule) {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.alerts.set(ruleId, {
      id: ruleId,
      ...rule,
      createdAt: new Date(),
      isActive: true
    });

    return {
      success: true,
      ruleId,
      rule: this.alerts.get(ruleId)
    };
  }

  async updateAlertRule(ruleId, updates) {
    const rule = this.alerts.get(ruleId);
    if (!rule) {
      return {
        success: false,
        error: 'Alert rule not found'
      };
    }

    Object.assign(rule, updates);
    rule.updatedAt = new Date();

    return {
      success: true,
      rule
    };
  }

  async deleteAlertRule(ruleId) {
    const deleted = this.alerts.delete(ruleId);
    
    return {
      success: deleted,
      ruleId
    };
  }

  async getAlertRules() {
    return Array.from(this.alerts.values());
  }

  // Historical data
  async getHistoricalData(metricName, timeRange = '1h') {
    // This would typically query a time-series database
    // For now, return simulated data
    const data = [];
    const now = Date.now();
    const interval = this.getTimeRangeInterval(timeRange);
    const points = this.getTimeRangePoints(timeRange);

    for (let i = 0; i < points; i++) {
      data.push({
        timestamp: new Date(now - (points - i) * interval),
        value: Math.random() * 100
      });
    }

    return {
      success: true,
      metric: metricName,
      timeRange,
      data
    };
  }

  getTimeRangeInterval(timeRange) {
    const intervals = {
      '1h': 60000,    // 1 minute
      '6h': 300000,   // 5 minutes
      '24h': 1800000, // 30 minutes
      '7d': 3600000,  // 1 hour
      '30d': 86400000 // 1 day
    };
    
    return intervals[timeRange] || intervals['1h'];
  }

  getTimeRangePoints(timeRange) {
    const points = {
      '1h': 60,
      '6h': 72,
      '24h': 48,
      '7d': 168,
      '30d': 30
    };
    
    return points[timeRange] || points['1h'];
  }
}

module.exports = new MonitoringService();
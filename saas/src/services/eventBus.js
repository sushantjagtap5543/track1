const EventEmitter = require('events');

/**
 * Anti-Gravity Centralized Event Bus
 * Broadcasts system-wide events for Admin-Client synchronization.
 */
class EventBus extends EventEmitter {
    publish(topic, payload) {
        console.log(`[EventBus] Publishing to ${topic}:`, payload);
        this.emit(topic, payload);
    }

    subscribe(topic, callback) {
        console.log(`[EventBus] Subscribing to ${topic}`);
        this.on(topic, callback);
    }
}

const bus = new EventBus();

// Example: Admin updates a plan, notify relevant clients
bus.subscribe('admin:plan_update', (data) => {
    console.log(`[Sync] Notifying Client ${data.userId} of plan change to ${data.planId}`);
});

module.exports = bus;

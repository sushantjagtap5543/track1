/**
 * Anti-Gravity Distributed Transaction Wrapper
 * Manages atomic-like operations across distributed services (SaaS DB & Traccar API).
 */

class DistributedTransaction {
  constructor() {
    this.steps = [];
    this.completedSteps = [];
  }

  /**
   * Adds a step to the transaction.
   * @param {Function} action - The async action to perform.
   * @param {Function} rollback - The async rollback action if the transaction fails.
   */
  addStep(action, rollback) {
    this.steps.push({ action, rollback });
    return this;
  }

  async execute() {
    for (const step of this.steps) {
      try {
        const result = await step.action();
        this.completedSteps.push({ ...step, result });
      } catch (err) {
        console.error('Transaction failed at step, starting rollback...', err);
        await this.rollback();
        throw err;
      }
    }
    return this.completedSteps.map(s => s.result);
  }

  async rollback() {
    // Rollback in reverse order
    for (let i = this.completedSteps.length - 1; i >= 0; i--) {
      const step = this.completedSteps[i];
      try {
        if (step.rollback) {
          await step.rollback(step.result);
        }
      } catch (rollbackErr) {
        console.error('Rollback step failed!', rollbackErr);
        // We log but continue rolling back other steps
      }
    }
  }
}

module.exports = DistributedTransaction;

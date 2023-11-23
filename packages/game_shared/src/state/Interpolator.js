const State = require('./State');
const Diff = require('./Diff');
const { round } = require('@ud-viz/utils_shared');

/** @class */
class Interpolator {
  /**
   * Handle reception of states over time and can on demand compute current states that need to be processed.
   * Current states are delivered/computed with a delay and can be interpolated in order to "smooth" them
   * see {@link State} to have a better understanding
   *
   * Very inspired (quite identical) from there {@link https://victorzhou.com/blog/build-an-io-game-part-1/#7-client-state}
   *
   * @param {number} [delay=100] - delay between state received and state delivered/computed
   * @param {boolean} [computeBandWidth=false] - compute bandwidth of state
   */
  constructor(delay, computeBandWidth = false) {
    /**
     * delay between state received and state delivered
     *
     * @type {number}
     */
    this.delay = delay || 100;

    /**
     * buffer of states received
     *
     * @type {State[]}
     */
    this.states = [];

    /**
     * interpolator start time
     *
     * @type {number}
     */
    this.startTimestamp = 0;

    /**
     * time of the first state received
     *
     * @type {number}
     */
    this.firstStateTimestamp = 0;

    /**
     * buffer of states deprecated (out of time) but not treated (not deliver/compute)
     *
     * @type {State[]}
     */
    this._notConsumedStates = [];

    /**
     * time of the last state received
     *
     * @type {number}
     */
    this.lastTimeState = 0;

    /**
     * @type {object<timestamp:number,number:number>}
     */
    this.bandWidthStateValue = null;

    /** @type {boolean} */
    this.computeBandWidth = computeBandWidth;

    /**
     * time between last state received and the previous one
     *
     * @type {object<timestamp:number,number:number>}
     */
    this.ping = null;
  }

  /**
   *
   * @returns {number} - interpolator ping
   */
  getPing() {
    return this.ping;
  }

  /**
   * Add a new state to interpolator
   *
   * @param {State} state - new state receive
   */
  onNewState(state) {
    if (!state) {
      throw new Error('no state');
    }

    // Compute ping
    const now = Date.now();
    this.ping = { timestamp: now, number: now - this.lastTimeState };
    this.lastTimeState = now;

    if (this.computeBandWidth) {
      const size = new TextEncoder().encode(JSON.stringify(state)).length;
      const kiloBytes = size / 1024;
      this.bandWidthStateValue = { number: kiloBytes, timestamp: now };
    }

    this.states.push(state);

    // Keep only one state before the current server time
    const index = this._computeIndexBaseState();

    if (index > 0) {
      const stateDeleted = this.states.splice(0, index);
      for (let iStateDel = 0; iStateDel < stateDeleted.length; iStateDel++) {
        const element = stateDeleted[iStateDel];
        if (!element.hasBeenConsumed()) this._notConsumedStates.push(element); // Register states not consumed
      }
    }
  }

  /**
   *
   * @returns {State} - the last state received
   */
  _getLastStateReceived() {
    return this.states[this.states.length - 1];
  }

  /**
   * Compute current server time, server is the entity where states are computed
   *
   * @returns {number} - current server time
   */
  _computeCurrentServerTime() {
    return (
      this.firstStateTimestamp + Date.now() - this.startTimestamp - this.delay
    );
  }

  /**
   *
   * @returns {number} - the index of the first state before server time
   */
  _computeIndexBaseState() {
    const serverTime = this._computeCurrentServerTime();
    for (let i = this.states.length - 1; i >= 0; i--) {
      if (this.states[i].getTimestamp() <= serverTime) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Compute the next state based on a {@link Diff}
   *
   * @param {Diff} diff - diff received
   */
  onNewDiff(diff) {
    const last = this._getLastStateReceived();
    if (!last) {
      console.log('no last state');
      return;
    }
    const newState = last.add(diff);
    this.onNewState(newState);
  }

  /**
   * Init interpolator attributes with a first state
   *
   * @param {State} state - first state received
   */
  onFirstState(state) {
    this.firstStateTimestamp = state.getTimestamp();
    this.startTimestamp = Date.now();
    this.states.length = 0;
    this.lastTimeState = 0;
    this.onNewState(state);
  }

  /**
   * Deliver/Compute current state
   *
   * @returns {State} - current state
   */
  computeCurrentState() {
    if (!this.firstStateTimestamp) {
      return null;
    }

    let result;

    const index = this._computeIndexBaseState();

    const serverTime = this._computeCurrentServerTime();

    // If base is the most recent update we have, use its state.
    // Otherwise, interpolate between its state and the state of (base + 1).
    if (index < 0 || index === this.states.length - 1) {
      result = this._getLastStateReceived();
      result.setConsumed(true);
    } else {
      const baseState = this.states[index];
      baseState.setConsumed(true);
      const nextState = this.states[index + 1];
      const ratio =
        (serverTime - baseState.getTimestamp()) /
        (nextState.getTimestamp() - baseState.getTimestamp());
      result = State.interpolate(baseState, nextState, ratio);
    }

    return result;
  }

  /**
   * Deliver/Compute current state + add the ones not treated/consumed
   *
   * @returns {State[]} - current states
   */
  computeCurrentStates() {
    if (!this.states.length) {
      console.log('no state received yet');
      return [];
    }

    const result = this._notConsumedStates;
    this._notConsumedStates = [];
    result.push(this.computeCurrentState());

    return result;
  }
}

module.exports = Interpolator;

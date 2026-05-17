/**
 * EscrowHubs × NaijaLancers Bridge — Drop-in Script
 * Version: 1.0.0
 * ────────────────────────────────────────────────────────────────────────────
 * INSTALL: Add this ONE line to your page <head>:
 *
 *   <script src="https://celo.escrowhubs.io/sdk/njl-bridge.js"></script>
 *
 * USAGE: Call EscrowHubs.init() once your user is logged in:
 *
 *   EscrowHubs.init({
 *     iframeId: "escrowhubs-iframe",   // id of your <iframe> element
 *     user: {
 *       id:        currentUser.id,
 *       full_name: currentUser.full_name,
 *       email:     currentUser.email,
 *     },
 *     getBalance:      (userId, currency) => yourGetBalanceFunction(userId, currency),
 *     charge:          (userId, amount, description, toAddress) => yourChargeFunction(...),
 *     getPayoutAddress:(userId) => yourGetWalletAddress(userId),
 *   });
 *
 * That's it. The bridge handles the rest automatically.
 * ────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  "use strict";

  const ORIGIN = "https://celo.escrowhubs.io";
  const TAG = "[EscrowHubs]";

  let _config = null;
  let _frame = null;
  let _user = null;
  let _listening = false;

  function post(msg) {
    if (!_frame || !_frame.contentWindow) {
      console.warn(TAG, "iframe not ready, dropping message:", msg.type);
      return;
    }
    _frame.contentWindow.postMessage(msg, ORIGIN);
  }

  async function _handleMessage(event) {
    if (event.origin !== ORIGIN) return;
    const { type, requestId } = event.data || {};

    switch (type) {

      // ── Child is ready → identify the user ───────────────────────────────
      case "njl_ready": {
        if (!_user) { console.warn(TAG, "njl_ready but no user set"); return; }
        post({
          type: "njl_identify",
          user: {
            user_id:   _user.id,
            full_name: _user.full_name,
            email:     _user.email,
            avatar:    _user.avatar  || null,
            phone:     _user.phone   || null,
          },
        });
        console.log(TAG, "Identified user:", _user.full_name);
        break;
      }

      // ── Balance query ─────────────────────────────────────────────────────
      case "njl_balance": {
        const currency = event.data.currency || "NC";
        let balance = "0";
        try {
          if (_config.getBalance) balance = await _config.getBalance(_user?.id, currency);
        } catch (e) { console.error(TAG, "getBalance error", e); }
        post({ type: "njl_balance_result", requestId, balance, currency });
        break;
      }

      // ── Charge request ────────────────────────────────────────────────────
      case "njl_charge": {
        // Acknowledge immediately so child doesn't time out
        post({ type: "njl_charge_received", requestId });
        try {
          const result = _config.charge
            ? await _config.charge(_user?.id, event.data.amount, event.data.description, event.data.to)
            : { success: false, error: "charge() not configured" };

          post(result.success
            ? { type: "njl_charge_result", requestId, success: true,
                currency: "USDT", amount: event.data.amount,
                user_id: _user?.id, to: event.data.to,
                txRef: result.txRef || null, tx_hash: result.txHash || null }
            : { type: "njl_charge_result", requestId, success: false,
                error: result.error || "Charge failed" });
        } catch (e) {
          post({ type: "njl_charge_result", requestId, success: false, error: e.message });
        }
        break;
      }

      // ── Payout address ────────────────────────────────────────────────────
      case "njl_payout": {
        let wallet_address = null;
        try {
          if (_config.getPayoutAddress) wallet_address = await _config.getPayoutAddress(_user?.id);
        } catch (e) { console.error(TAG, "getPayoutAddress error", e); }
        post({ type: "njl_payout_result", requestId, wallet_address,
               currency: event.data.currency || "USDT" });
        break;
      }

      // ── PIN verify (optional) ─────────────────────────────────────────────
      case "njl_verify_pin": {
        let verified = true;
        try {
          if (_config.verifyPin) verified = await _config.verifyPin(_user?.id, event.data.pin);
        } catch (e) { verified = false; }
        post({ type: "njl_verify_pin_result", requestId, verified });
        break;
      }
    }
  }

  const EscrowHubs = {
    /**
     * Initialize the bridge.
     * @param {object} opts
     * @param {string}   opts.iframeId         - id of the <iframe> element
     * @param {object}   opts.user             - { id, full_name, email }
     * @param {Function} opts.getBalance        - async (userId, currency) => balance string
     * @param {Function} opts.charge            - async (userId, amount, description, to) => { success, txRef, error }
     * @param {Function} opts.getPayoutAddress  - async (userId) => wallet address string
     * @param {Function} [opts.verifyPin]       - async (userId, pin) => boolean  (optional)
     */
    init(opts) {
      if (!opts || !opts.iframeId || !opts.user) {
        console.error(TAG, "init() requires { iframeId, user, getBalance, charge, getPayoutAddress }");
        return;
      }
      _config = opts;
      _user   = opts.user;
      _frame  = document.getElementById(opts.iframeId);

      if (!_frame) {
        console.error(TAG, "iframe not found:", opts.iframeId);
        return;
      }

      // Only attach listener once
      if (!_listening) {
        window.addEventListener("message", _handleMessage);
        _listening = true;
      }

      // Load the EscrowHubs app into the iframe
      _frame.src = ORIGIN + "/create";
      console.log(TAG, "Bridge ready. Loading EscrowHubs for:", _user.full_name);
    },

    /** Update user (e.g. after login) without reloading iframe */
    setUser(user) {
      _user = user;
    },

    /** Close the iframe and reset state */
    close() {
      if (_frame) _frame.src = "about:blank";
      _user  = null;
      _frame = null;
    },
  };

  global.EscrowHubs = EscrowHubs;
})(window);

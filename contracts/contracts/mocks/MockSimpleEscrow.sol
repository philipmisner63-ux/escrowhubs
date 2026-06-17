// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockSimpleEscrow
 * @notice Minimal stand-in for SimpleEscrow in AIArbiter tests. The AIArbiter
 *         only needs an address that has code and exposes resolveRelease /
 *         resolveRefund selectors.
 */
contract MockSimpleEscrow {
    address public beneficiary;
    bool public releaseCalled;
    bool public refundCalled;

    constructor(address _beneficiary) {
        beneficiary = _beneficiary;
    }

    function resolveRelease() external {
        releaseCalled = true;
    }

    function resolveRefund() external {
        refundCalled = true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockMilestoneEscrow
 * @notice Minimal stand-in for MilestoneEscrow in AIArbiter tests. Returns
 *         a fixed milestoneCount of 3 so the bounds check is exercised.
 */
contract MockMilestoneEscrow {
    address public beneficiary;
    bool public releaseCalled;
    bool public refundCalled;

    constructor(address _beneficiary) {
        beneficiary = _beneficiary;
    }

    function milestoneCount() external pure returns (uint256) {
        return 3;
    }

    function resolveRelease(uint256 /* index */) external {
        releaseCalled = true;
    }

    function resolveRefund(uint256 /* index */) external {
        refundCalled = true;
    }
}

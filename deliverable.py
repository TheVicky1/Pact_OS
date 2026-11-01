# Updated implementation of Zipf's Law priority power-law distribution validator
# based on the maintainer's feedback.

from math import sqrt
from typing import List, Dict, Any

def calculate_rmse(observed: List[float], expected: List[float]) -> float:
    """
    Calculate the Root Mean Square Error (RMSE) between observed and expected values.
    """
    if len(observed) != len(expected):
        raise ValueError("Observed and expected lists must have the same length.")
    
    squared_errors = [(o - e) ** 2 for o, e in zip(observed, expected)]
    mean_squared_error = sum(squared_errors) / len(squared_errors)
    return sqrt(mean_squared_error)

def diagnose_zipf_distribution(observed: List[float], ideal_shares: List[float]) -> Dict[str, Any]:
    """
    Diagnose the Zipf distribution based on observed and ideal shares.
    """
    rmse = calculate_rmse(observed, ideal_shares)
    top_priority_focus_ratio = observed[0] / sum(observed) if observed else 0

    if rmse <= 0.08:
        diagnosis = "perfect_hierarchy"
        actionable_insight = "No action needed; distribution is ideal."
    elif rmse <= 0.18:
        if top_priority_focus_ratio > ideal_shares[0]:
            diagnosis = "over_concentrated_focus"
            actionable_insight = "Reduce focus on top priority to balance distribution."
        else:
            diagnosis = "moderate_hierarchy"
            actionable_insight = "Maintain current distribution; slight adjustments may improve balance."
    else:
        diagnosis = "diffuse_attention"
        actionable_insight = "Increase focus on top priorities to improve distribution."

    return {
        "rootMeanSquareError": rmse,
        "diagnosis": diagnosis,
        "actionableInsight": actionable_insight,
        "isPowerLawDistributed": rmse <= 0.18
    }

# Example test cases for the updated implementation
def test_diagnose_zipf_distribution():
    """
    Test cases for the diagnose_zipf_distribution function.
    """
    # Test case 1: Perfect hierarchy
    observed_1 = [50, 25, 12.5, 6.25, 6.25]
    ideal_shares_1 = [50, 25, 12.5, 6.25, 6.25]
    result_1 = diagnose_zipf_distribution(observed_1, ideal_shares_1)
    assert result_1["diagnosis"] == "perfect_hierarchy"
    assert result_1["isPowerLawDistributed"] is True
    assert result_1["rootMeanSquareError"] <= 0.08

    # Test case 2: Moderate hierarchy
    observed_2 = [45, 30, 15, 5, 5]
    ideal_shares_2 = [50, 25, 12.5, 6.25, 6.25]
    result_2 = diagnose_zipf_distribution(observed_2, ideal_shares_2)
    assert result_2["diagnosis"] == "moderate_hierarchy"
    assert result_2["isPowerLawDistributed"] is True
    assert 0.08 < result_2["rootMeanSquareError"] <= 0.18

    # Test case 3: Over-concentrated focus
    observed_3 = [70, 10, 10, 5, 5]
    ideal_shares_3 = [50, 25, 12.5, 6.25, 6.25]
    result_3 = diagnose_zipf_distribution(observed_3, ideal_shares_3)
    assert result_3["diagnosis"] == "over_concentrated_focus"
    assert result_3["isPowerLawDistributed"] is True
    assert 0.08 < result_3["rootMeanSquareError"] <= 0.18

    # Test case 4: Diffuse attention
    observed_4 = [20, 20, 20, 20, 20]
    ideal_shares_4 = [50, 25, 12.5, 6.25, 6.25]
    result_4 = diagnose_zipf_distribution(observed_4, ideal_shares_4)
    assert result_4["diagnosis"] == "diffuse_attention"
    assert result_4["isPowerLawDistributed"] is False
    assert result_4["rootMeanSquareError"] > 0.18

# Run test cases
if __name__ == "__main__":
    test_diagnose_zipf_distribution()
    print("All test cases passed!")

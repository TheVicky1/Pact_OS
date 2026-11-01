import math

def evaluate_cognitive_ramping(time_minutes, inflection_minutes=None, steepness_k=None):
    """
    Evaluate the cognitive ramping score using a logistic sigmoid function.

    Parameters:
    - time_minutes (float): The time in minutes for which the score is calculated.
    - inflection_minutes (float, optional): The time at which the sigmoid curve inflects.
      Must be finite and positive. Defaults to 10 if invalid.
    - steepness_k (float, optional): The steepness of the sigmoid curve.
      Must be finite and positive. Defaults to 1 if invalid.

    Returns:
    - float: The cognitive ramping score (between 0 and 1).
    """
    DEFAULT_INFLECTION_MINUTES = 10.0
    DEFAULT_STEEPNESS_K = 1.0

    # Validate inflection_minutes
    if not (isinstance(inflection_minutes, (int, float)) and math.isfinite(inflection_minutes) and inflection_minutes > 0):
        inflection_minutes = DEFAULT_INFLECTION_MINUTES

    # Validate steepness_k
    if not (isinstance(steepness_k, (int, float)) and math.isfinite(steepness_k) and steepness_k > 0):
        steepness_k = DEFAULT_STEEPNESS_K

    try:
        exponent = -steepness_k * (time_minutes - inflection_minutes)
        raw_probability = 1 / (1 + math.exp(exponent))
    except OverflowError:
        # Handle extreme values gracefully
        raw_probability = 0.0 if time_minutes < inflection_minutes else 1.0

    # Bound within [0.0, 1.0] and format to 4 decimal precision
    flow_probability_fraction = max(0.0, min(1.0, round(raw_probability, 4)))
    return flow_probability_fraction

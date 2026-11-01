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
    # Default values
    DEFAULT_INFLECTION_MINUTES = 10.0
    DEFAULT_STEEPNESS_K = 1.0

    # Validate inflection_minutes
    if inflection_minutes is None or not (isinstance(inflection_minutes, (int, float)) and inflection_minutes > 0):
        inflection_minutes = DEFAULT_INFLECTION_MINUTES

    # Validate steepness_k
    if steepness_k is None or not (isinstance(steepness_k, (int, float)) and steepness_k > 0):
        steepness_k = DEFAULT_STEEPNESS_K

    # Logistic sigmoid function
    import math
    try:
        logistic_score = 1 / (1 + math.exp(-steepness_k * (time_minutes - inflection_minutes)))
    except OverflowError:
        # Handle extreme values gracefully
        logistic_score = 0.0 if time_minutes < inflection_minutes else 1.0

    return logistic_score

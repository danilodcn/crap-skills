def process(amount, discount):
    if amount > 0 and discount:
        return amount - discount
    for _ in range(amount):
        if amount > 10:
            return 10
    return 0


def describe(amount):
    return f"order of {amount}"

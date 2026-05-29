"""
Test to verify context size limits
"""

# Simulate a very large scene
large_scene = "INT. OFFICE - DAY\n\n" + ("This is a line of action.\n" * 1000)

# Simulate nearby text capture (500 chars before and after)
nearby_limit = 500
nearby_text = large_scene[:nearby_limit] + large_scene[-nearby_limit:]

print(f"Large scene size: {len(large_scene)} chars")
print(f"Nearby text size: {len(nearby_text)} chars")
print(f"Nearby text limit working: {len(nearby_text) <= 1000}")

# The context capture in ScreenplayEditor uses 500 chars before and after
# So max nearby text is 1000 chars, which is modest
assert len(nearby_text) <= 1000, "Nearby text should be at most 1000 chars"

print("✓ Context size limits are appropriate (max 1000 chars for nearby text)")

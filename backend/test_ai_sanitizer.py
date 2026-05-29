"""
Unit tests for AI sanitizer functions
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.ai.providers import sanitize_screenplay_output


def test_strip_code_fences():
    """Test that markdown code fences are stripped"""
    input_text = """```fountain
INT. OFFICE - DAY

JOHN enters.
```"""
    expected = """INT. OFFICE - DAY

JOHN enters."""
    assert sanitize_screenplay_output(input_text) == expected


def test_strip_code_fences_with_language():
    """Test stripping code fences with various language identifiers"""
    test_cases = [
        ("```text\nHello\n```", "Hello"),
        ("```\nHello\n```", "Hello"),
        ("```fountain\nHello\n```", "Hello"),
    ]
    for input_text, expected in test_cases:
        assert sanitize_screenplay_output(input_text) == expected


def test_trim_whitespace():
    """Test that leading/trailing whitespace is trimmed"""
    input_text = """

    INT. OFFICE - DAY
    
    """
    expected = "INT. OFFICE - DAY"
    assert sanitize_screenplay_output(input_text) == expected


def test_empty_string():
    """Test that empty strings are handled"""
    assert sanitize_screenplay_output("") == ""
    assert sanitize_screenplay_output("   ") == ""


def test_no_modification_needed():
    """Test that clean screenplay text is unchanged"""
    input_text = """INT. OFFICE - DAY

JOHN enters the office."""
    assert sanitize_screenplay_output(input_text) == input_text


def test_code_fence_at_end_only():
    """Test stripping code fence at end only"""
    input_text = """INT. OFFICE - DAY

JOHN enters.
```"""
    expected = """INT. OFFICE - DAY

JOHN enters."""
    assert sanitize_screenplay_output(input_text) == expected


if __name__ == "__main__":
    test_strip_code_fences()
    test_strip_code_fences_with_language()
    test_trim_whitespace()
    test_empty_string()
    test_no_modification_needed()
    test_code_fence_at_end_only()
    print("✓ All sanitizer tests passed!")

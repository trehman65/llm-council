#!/usr/bin/env python3
"""Script to verify the key-takeaways endpoint is registered."""

import requests
import json

def test_endpoint():
    base_url = "http://localhost:8001"
    
    # Test 1: Check if test endpoint works
    print("Testing endpoint registration...")
    try:
        response = requests.get(f"{base_url}/api/second-order/key-takeaways/test", timeout=5)
        if response.status_code == 200:
            print("✓ Test endpoint works! Endpoint is registered.")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Test endpoint returned status {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend. Is it running on port 8001?")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    # Test 2: Try the actual POST endpoint
    print("\nTesting POST endpoint...")
    test_data = {
        "analysis_text": "This is a test analysis text that is longer than 100 characters to verify the key takeaways endpoint is working correctly. It should return some key takeaways.",
        "stage_type": "first"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/second-order/key-takeaways",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            print("✓ POST endpoint works!")
            print(f"  Received {len(result.get('takeaways', []))} takeaways")
            for i, takeaway in enumerate(result.get('takeaways', [])[:3], 1):
                print(f"  {i}. {takeaway[:80]}...")
            return True
        elif response.status_code == 404:
            print("✗ Endpoint returns 404 - backend needs to be restarted!")
            print("  The endpoint code exists but isn't registered.")
            return False
        else:
            print(f"✗ POST endpoint returned status {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error testing POST endpoint: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Key Takeaways Endpoint Verification")
    print("=" * 60)
    print()
    
    success = test_endpoint()
    
    print()
    print("=" * 60)
    if success:
        print("✓ All tests passed! Endpoint is working.")
    else:
        print("✗ Tests failed. Please restart your backend server.")
        print()
        print("To restart:")
        print("  1. Stop the current backend (Ctrl+C)")
        print("  2. Start it again: uv run python -m backend.main")
        print("     OR: ./start.sh")
    print("=" * 60)


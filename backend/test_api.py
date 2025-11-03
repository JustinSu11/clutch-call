"""
Simple test script to verify backend API endpoints are working
"""
import requests
import json

def test_endpoint(url, description):
    """Test an API endpoint and print results"""
    print(f"\n=== Testing {description} ===")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response (first 200 chars):", str(data)[:200] + "..." if len(str(data)) > 200 else str(data))
            return True
        else:
            print("Error:", response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to server - is it running?")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    base_url = "http://localhost:8000/api/v1"
    
    # Test basic health endpoint
    test_endpoint(f"{base_url}/health", "Health Check")
    
    # Test individual league today endpoints
    test_endpoint(f"{base_url}/today/nba", "NBA Today")
    test_endpoint(f"{base_url}/today/nfl", "NFL Today") 
    test_endpoint(f"{base_url}/today/soccer", "Soccer Today")
    
    # Test aggregated today endpoint
    test_endpoint(f"{base_url}/today", "All Leagues Today")

if __name__ == "__main__":
    main()
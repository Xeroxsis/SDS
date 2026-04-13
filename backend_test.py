#!/usr/bin/env python3

import requests
import sys
import json
import base64
from datetime import datetime
from pathlib import Path

class StrokeDetectionAPITester:
    def __init__(self, base_url="https://brain-scan-ai-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.patient_id = None
        self.scan_id = None

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if files:
            test_headers.pop('Content-Type', None)  # Let requests set it for multipart

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = self.session.post(url, data=data, files=files)
                else:
                    response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error: {error_data}")
                except:
                    self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test GET /api/ returns API health message"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "/",
            200
        )
        if success and 'message' in response:
            self.log(f"   API Message: {response['message']}")
        return success

    def test_register(self):
        """Test POST /api/auth/register creates a new user"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User"
            }
        )
        if success and 'id' in response:
            self.user_id = response['id']
            self.log(f"   Created user ID: {self.user_id}")
        return success

    def test_login_admin(self):
        """Test POST /api/auth/login with admin credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={
                "email": "admin@example.com",
                "password": "admin123"
            }
        )
        if success and 'id' in response:
            self.user_id = response['id']
            self.log(f"   Logged in as: {response.get('name', 'Admin')}")
        return success

    def test_get_me(self):
        """Test GET /api/auth/me returns authenticated user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "/auth/me",
            200
        )
        if success:
            self.log(f"   User: {response.get('name', 'Unknown')} ({response.get('email', 'No email')})")
        return success

    def test_logout(self):
        """Test POST /api/auth/logout clears cookies"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "/auth/logout",
            200
        )
        if success:
            self.log(f"   Message: {response.get('message', 'Logged out')}")
        return success

    def test_create_patient(self):
        """Test POST /api/patients creates a patient record"""
        success, response = self.run_test(
            "Create Patient",
            "POST",
            "/patients",
            200,
            data={
                "name": "John Doe",
                "age": 45,
                "gender": "Male",
                "medical_history": "Hypertension, diabetes"
            }
        )
        if success and 'id' in response:
            self.patient_id = response['id']
            self.log(f"   Created patient ID: {self.patient_id}")
        return success

    def test_list_patients(self):
        """Test GET /api/patients lists patients"""
        success, response = self.run_test(
            "List Patients",
            "GET",
            "/patients",
            200
        )
        if success:
            self.log(f"   Found {len(response)} patients")
        return success

    def test_update_patient(self):
        """Test PUT /api/patients/{id} updates patient"""
        if not self.patient_id:
            self.log("❌ Update Patient - No patient ID available")
            return False
            
        success, response = self.run_test(
            "Update Patient",
            "PUT",
            f"/patients/{self.patient_id}",
            200,
            data={
                "medical_history": "Hypertension, diabetes, updated notes"
            }
        )
        return success

    def test_delete_patient(self):
        """Test DELETE /api/patients/{id} deletes patient"""
        if not self.patient_id:
            self.log("❌ Delete Patient - No patient ID available")
            return False
            
        success, response = self.run_test(
            "Delete Patient",
            "DELETE",
            f"/patients/{self.patient_id}",
            200
        )
        if success:
            self.patient_id = None  # Reset since deleted
        return success

    def create_test_image(self):
        """Create a simple test image for MRI scan analysis"""
        try:
            from PIL import Image
            import io
            
            # Create a simple grayscale image that mimics brain scan
            img = Image.new('L', (256, 256), color=128)
            # Add some patterns to simulate brain tissue
            pixels = img.load()
            for i in range(256):
                for j in range(256):
                    # Create circular pattern
                    center_x, center_y = 128, 128
                    distance = ((i - center_x) ** 2 + (j - center_y) ** 2) ** 0.5
                    if distance < 100:
                        pixels[i, j] = int(200 - distance)
                    else:
                        pixels[i, j] = 50
            
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            return buffer
        except ImportError:
            # Fallback: create minimal PNG data
            # This is a minimal 1x1 PNG
            png_data = base64.b64decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            )
            return io.BytesIO(png_data)

    def test_scan_analyze(self):
        """Test POST /api/scans/analyze uploads MRI image and returns classification"""
        test_image = self.create_test_image()
        
        success, response = self.run_test(
            "MRI Scan Analysis",
            "POST",
            "/scans/analyze",
            200,
            data={
                'patient_id': self.patient_id if self.patient_id else '',
                'patient_name': 'Test Patient'
            },
            files={'file': ('test_mri.png', test_image, 'image/png')}
        )
        
        if success:
            self.scan_id = response.get('id')
            classification = response.get('classification', 'unknown')
            confidence = response.get('confidence', 0)
            self.log(f"   Classification: {classification} (confidence: {confidence:.2%})")
            
            # Verify required fields
            required_fields = ['classification', 'confidence', 'probabilities', 'features', 'stroke_info']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                self.log(f"   ✅ All required fields present")
                
        return success

    def test_list_scans(self):
        """Test GET /api/scans lists scans"""
        success, response = self.run_test(
            "List Scans",
            "GET",
            "/scans",
            200
        )
        if success:
            self.log(f"   Found {len(response)} scans")
        return success

    def test_get_scan(self):
        """Test GET /api/scans/{id} returns full scan with image_data"""
        if not self.scan_id:
            self.log("❌ Get Scan - No scan ID available")
            return False
            
        success, response = self.run_test(
            "Get Scan Details",
            "GET",
            f"/scans/{self.scan_id}",
            200
        )
        if success:
            has_image = 'image_data' in response
            self.log(f"   Has image data: {has_image}")
        return success

    def test_scan_pdf(self):
        """Test GET /api/scans/{id}/pdf downloads a PDF report"""
        if not self.scan_id:
            self.log("❌ Download PDF - No scan ID available")
            return False
            
        url = f"{self.base_url}/api/scans/{self.scan_id}/pdf"
        self.tests_run += 1
        self.log("🔍 Testing Download PDF Report...")
        
        try:
            response = self.session.get(url)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                self.log(f"✅ Download PDF Report - Status: 200")
                self.log(f"   Content-Type: {content_type}")
                self.log(f"   Content-Length: {content_length} bytes")
                
                # Verify it's actually a PDF
                if response.content.startswith(b'%PDF'):
                    self.log("   ✅ Valid PDF format")
                else:
                    self.log("   ⚠️  Content doesn't appear to be PDF")
            else:
                self.log(f"❌ Download PDF Report - Expected 200, got {response.status_code}")
                
            return success
            
        except Exception as e:
            self.log(f"❌ Download PDF Report - Error: {str(e)}")
            return False

    def test_dashboard_stats(self):
        """Test GET /api/dashboard/stats returns stats"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "/dashboard/stats",
            200
        )
        if success:
            stats = ['total_scans', 'total_patients', 'recent_scans']
            for stat in stats:
                if stat in response:
                    value = response[stat]
                    if stat == 'recent_scans':
                        self.log(f"   {stat}: {len(value)} items")
                    else:
                        self.log(f"   {stat}: {value}")
        return success

def main():
    """Run all backend API tests"""
    print("=" * 60)
    print("🧠 NeuroScan AI - Backend API Testing")
    print("=" * 60)
    
    tester = StrokeDetectionAPITester()
    
    # Test sequence
    tests = [
        ("API Health", tester.test_api_health),
        ("User Registration", tester.test_register),
        ("Admin Login", tester.test_login_admin),
        ("Get Current User", tester.test_get_me),
        ("Create Patient", tester.test_create_patient),
        ("List Patients", tester.test_list_patients),
        ("Update Patient", tester.test_update_patient),
        ("MRI Scan Analysis", tester.test_scan_analyze),
        ("List Scans", tester.test_list_scans),
        ("Get Scan Details", tester.test_get_scan),
        ("Download PDF Report", tester.test_scan_pdf),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("User Logout", tester.test_logout),
        ("Delete Patient", tester.test_delete_patient),
    ]
    
    print(f"\n🚀 Starting {len(tests)} API tests...\n")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log(f"❌ {test_name} - Unexpected error: {str(e)}")
        print()  # Add spacing between tests
    
    # Print results
    print("=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
/**
 * Unit tests for PythonAnalyzer
 *
 * These tests validate Python code analysis using regex patterns,
 * with special focus on Django patterns, imports, functions, classes,
 * and API endpoint detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PythonAnalyzer } from '../src/parsers/python-analyzer.js';

describe('PythonAnalyzer', () => {
  let analyzer: PythonAnalyzer;

  beforeEach(() => {
    analyzer = new PythonAnalyzer();
  });

  describe('basic Python analysis', () => {
    it('should analyze simple Python functions', async () => {
      const pythonCode = `
def hello_world():
    """Simple hello world function"""
    print("Hello, World!")
    return True

def add_numbers(a, b):
    return a + b
      `;

      const result = await analyzer.analyzePython(pythonCode, 'test.py');

      expect(result.path).toBe('test.py');
      expect(result.language).toBe('python');
      expect(Object.keys(result.functions)).toHaveLength(2);
      expect(result.functions['hello_world()']).toBeDefined();
      expect(result.functions['add_numbers(a, b)']).toBeDefined();
      expect(result.functions['hello_world()'].docstring).toBe('Simple hello world function');
      expect(result.functions['hello_world()'].is_async).toBe(false);
      expect(result.functions['add_numbers(a, b)'].parameters).toEqual(['a', 'b']);
    });

    it('should analyze Python classes', async () => {
      const pythonCode = `
class TestClass:
    """A test class"""

    def __init__(self, name):
        self.name = name

    def get_name(self):
        return self.name
      `;

      const result = await analyzer.analyzePython(pythonCode, 'test.py');

      expect(Object.keys(result.classes)).toHaveLength(1);
      expect(result.classes['TestClass']).toBeDefined();
      expect(result.classes['TestClass'].docstring).toBe('A test class');
      expect(Object.keys(result.classes['TestClass'].methods)).toHaveLength(2);
      expect(result.classes['TestClass'].methods['__init__(self, name)']).toBeDefined();
      expect(result.classes['TestClass'].methods['get_name(self)']).toBeDefined();
    });

    it('should analyze Python imports', async () => {
      const pythonCode = `
import os
import sys
from django.core.exceptions import ValidationError
from rest_framework import generics, serializers, status
from .models import User, Profile
      `;

      const result = await analyzer.analyzePython(pythonCode, 'test.py');

      expect(result.imports['os']).toEqual(['os']);
      expect(result.imports['sys']).toEqual(['sys']);
      expect(result.imports['django.core.exceptions']).toContain('ValidationError');
      expect(result.imports['rest_framework']).toContain('generics');
      expect(result.imports['rest_framework']).toContain('serializers');
      expect(result.imports['rest_framework']).toContain('status');
      expect(result.imports['.models']).toContain('User');
      expect(result.imports['.models']).toContain('Profile');
    });
  });

  describe('Django-specific analysis', () => {
    it('should detect Django API view classes', async () => {
      const djangoCode = `
from rest_framework.views import APIView
from rest_framework.response import Response

class BuyerLoginView(APIView):
    """
    POST /api/auth/login/buyer/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        return Response({"token": "test"})
      `;

      const result = await analyzer.analyzePython(djangoCode, 'views.py');

      expect(result.classes['BuyerLoginView']).toBeDefined();
      expect(result.classes['BuyerLoginView'].base_classes).toContain('APIView');
      expect(result.classes['BuyerLoginView'].is_component).toBe(true);
      expect(result.classes['BuyerLoginView'].docstring).toContain('POST /api/auth/login/buyer/');

      // Check for HTTP method handler
      expect(result.classes['BuyerLoginView'].methods['post(self, request)']).toBeDefined();
      expect(result.classes['BuyerLoginView'].methods['post(self, request)'].api_endpoints).toHaveLength(1);
      expect(result.classes['BuyerLoginView'].methods['post(self, request)'].api_endpoints[0].type).toBe('django_http_method');
      expect(result.classes['BuyerLoginView'].methods['post(self, request)'].api_endpoints[0].method).toBe('POST');
    });

    it('should detect Django decorators and API views', async () => {
      const djangoCode = `
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema

@api_view(["POST"])
@permission_classes([AllowAny])
@extend_schema(
    request=AdminUserCreateSerializer,
    responses={201: OpenApiResponse(description="User created")}
)
def create_admin_user(request):
    """
    Create a new administrative user.
    """
    serializer = AdminUserCreateSerializer(data=request.data)
    return Response({"status": "success"})
      `;

      const result = await analyzer.analyzePython(djangoCode, 'views.py');

      expect(result.functions['create_admin_user(request)']).toBeDefined();

      const func = result.functions['create_admin_user(request)'];
      expect(func.decorators).toBeDefined();
      expect(func.decorators?.length).toBe(3);
      expect(func.decorators?.map(d => d.name)).toContain('api_view');
      expect(func.decorators?.map(d => d.name)).toContain('permission_classes');
      expect(func.decorators?.map(d => d.name)).toContain('extend_schema');

      expect(func.api_endpoints).toHaveLength(2);
      expect(func.api_endpoints.some(ep => ep.type === 'django_api_view')).toBe(true);
      expect(func.api_endpoints.some(ep => ep.type === 'django_documented_api')).toBe(true);
    });

    it('should detect Django models', async () => {
      const djangoCode = `
from django.db import models

class User(models.Model):
    """User model"""
    username = models.CharField(max_length=150)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField()
      `;

      const result = await analyzer.analyzePython(djangoCode, 'models.py');

      expect(result.classes['User']).toBeDefined();
      expect(result.classes['Profile']).toBeDefined();
      expect(result.classes['User'].base_classes).toContain('models.Model');
      expect(result.classes['User'].is_component).toBe(true);
      expect(result.classes['User'].docstring).toBe('User model');
    });

    it('should detect Django serializers', async () => {
      const djangoCode = `
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
      `;

      const result = await analyzer.analyzePython(djangoCode, 'serializers.py');

      expect(result.classes['UserSerializer']).toBeDefined();
      expect(result.classes['LoginSerializer']).toBeDefined();
      expect(result.classes['UserSerializer'].base_classes).toContain('serializers.ModelSerializer');
      expect(result.classes['LoginSerializer'].base_classes).toContain('serializers.Serializer');
      expect(result.classes['UserSerializer'].is_component).toBe(true);
      expect(result.classes['LoginSerializer'].is_component).toBe(true);
    });
  });

  describe('real Django file analysis', () => {
    it('should analyze the provided Django views.py file', async () => {
      const realDjangoCode = `import logging

import jwt
import requests
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models, transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    inline_serializer,
)

from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.magento import magento_api_call, magento_api_call_with_admin
from partners.models import BusinessPartnerProfile

from .models import Address, HousingSociety, OTPVerification, UserMapping
from .serializers import (
    AddressSerializer,
    AdminUserCreateSerializer,
)

logger = logging.getLogger(__name__)


class HousingSocietyListView(generics.ListAPIView):
    """
    GET /api/auth/housing-societies/
    """
    queryset = HousingSociety.objects.all()
    serializer_class = HousingSocietySerializer
    permission_classes = []


class BuyerLoginView(APIView):
    """
    POST /api/auth/login/buyer/
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: AuthTokenSerializer},
        tags=["Authentication"],
        summary="Buyer Login",
        description="Authenticates a Buyer and returns a JWT token.",
    )
    def post(self, request):
        print("A1")
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid input data."}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response({"token": "success"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@extend_schema(
    request=AdminUserCreateSerializer,
    responses={
        201: OpenApiResponse(description="Admin user created successfully"),
        400: OpenApiResponse(description="Invalid data provided"),
    },
    description="Create a new admin user",
    tags=["User Management"],
)
def create_admin_user(request):
    """
    Create a new administrative user.
    Requires administrator privileges.
    """
    serializer = AdminUserCreateSerializer(data=request.data)
    return Response({"status": "success"}, status=status.HTTP_201_CREATED)
      `;

      const result = await analyzer.analyzePython(realDjangoCode, 'accounts/views.py');

      // Basic file info
      expect(result.path).toBe('accounts/views.py');
      expect(result.language).toBe('python');
      expect(result.lines).toBeGreaterThan(50);
      expect(result.characters).toBeGreaterThan(1000);

      // Check imports
      expect(result.imports['logging']).toBeDefined();
      expect(result.imports['django.core.exceptions']).toContain('ValidationError');
      expect(result.imports['rest_framework']).toContain('generics');
      expect(result.imports['rest_framework.views']).toContain('APIView');
      expect(result.imports['.models']).toContain('Address');
      expect(result.imports['.serializers']).toContain('AdminUserCreateSerializer');

      // Check classes
      expect(result.classes['HousingSocietyListView']).toBeDefined();
      expect(result.classes['BuyerLoginView']).toBeDefined();

      // Check HousingSocietyListView
      const housingSocietyView = result.classes['HousingSocietyListView'];
      expect(housingSocietyView.base_classes).toContain('generics.ListAPIView');
      expect(housingSocietyView.is_component).toBe(true);
      expect(housingSocietyView.docstring).toContain('GET /api/auth/housing-societies/');

      // Check BuyerLoginView
      const buyerLoginView = result.classes['BuyerLoginView'];
      expect(buyerLoginView.base_classes).toContain('APIView');
      expect(buyerLoginView.is_component).toBe(true);
      expect(buyerLoginView.docstring).toContain('POST /api/auth/login/buyer/');

      // Check post method in BuyerLoginView
      expect(buyerLoginView.methods['post(self, request)']).toBeDefined();
      const postMethod = buyerLoginView.methods['post(self, request)'];
      expect(postMethod.decorators).toBeDefined();
      expect(postMethod.decorators?.some(d => d.name === 'extend_schema')).toBe(true);
      expect(postMethod.api_endpoints).toHaveLength(2); // extend_schema + http_method
      expect(postMethod.api_endpoints.some(ep => ep.type === 'django_http_method')).toBe(true);
      expect(postMethod.api_endpoints.some(ep => ep.method === 'POST')).toBe(true);

      // Check standalone function
      expect(result.functions['create_admin_user(request)']).toBeDefined();
      const createAdminFunc = result.functions['create_admin_user(request)'];
      expect(createAdminFunc.decorators).toBeDefined();
      expect(createAdminFunc.decorators?.length).toBe(3);
      expect(createAdminFunc.decorators?.map(d => d.name)).toContain('api_view');
      expect(createAdminFunc.decorators?.map(d => d.name)).toContain('permission_classes');
      expect(createAdminFunc.decorators?.map(d => d.name)).toContain('extend_schema');
      expect(createAdminFunc.api_endpoints).toHaveLength(2);
      expect(createAdminFunc.docstring).toContain('Create a new administrative user');

      // Verify we're not getting empty results like before
      expect(Object.keys(result.imports).length).toBeGreaterThan(5);
      expect(Object.keys(result.functions).length).toBeGreaterThan(0);
      expect(Object.keys(result.classes).length).toBeGreaterThan(0);
    });
  });

  describe('async functions', () => {
    it('should detect async functions', async () => {
      const pythonCode = `
async def fetch_data(url):
    """Async function to fetch data"""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

def sync_function():
    return "sync"
      `;

      const result = await analyzer.analyzePython(pythonCode, 'async_test.py');

      expect(result.functions['fetch_data(url)'].is_async).toBe(true);
      expect(result.functions['sync_function()'].is_async).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle malformed Python code gracefully', async () => {
      const malformedCode = `
def broken_function(
    # Missing closing parenthesis and colon
    print("This is broken"
      `;

      const result = await analyzer.analyzePython(malformedCode, 'broken.py');

      expect(result.path).toBe('broken.py');
      expect(result.language).toBe('python');
      expect(result.error).toBeUndefined(); // Should not error, just parse what it can
      // Should still provide basic metrics
      expect(result.lines).toBeGreaterThan(0);
      expect(result.characters).toBeGreaterThan(0);
    });

    it('should handle empty files', async () => {
      const result = await analyzer.analyzePython('', 'empty.py');

      expect(result.path).toBe('empty.py');
      expect(result.language).toBe('python');
      expect(result.imports).toEqual({});
      expect(result.functions).toEqual({});
      expect(result.classes).toEqual({});
      expect(result.lines).toBe(1); // split('\n') creates one empty line
    });
  });
});

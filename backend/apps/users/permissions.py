from rest_framework.permissions import BasePermission

class AnonWriteOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method == 'POST'
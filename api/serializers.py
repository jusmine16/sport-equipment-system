"""
Serializers for Sport Equipment Borrowing API.
"""
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    UserProfile,
    Equipment,
    Borrower,
    BorrowTransaction,
    ReturnTransaction,
    ConditionLog,
)


# ============================================================================
# USER SERIALIZERS
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    """User serializer with profile role."""
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']

    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return 'user'


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name'
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.get_or_create(user=user, defaults={'role': 'user'})
        return user


# ============================================================================
# EQUIPMENT SERIALIZERS
# ============================================================================

class EquipmentSerializer(serializers.ModelSerializer):
    """Equipment CRUD serializer."""
    
    class Meta:
        model = Equipment
        fields = [
            'id', 'equipment_code', 'equipment_name', 'category',
            'total_quantity', 'available_quantity', 'condition_status',
            'image', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if data.get('total_quantity', 0) < 0:
            raise serializers.ValidationError(
                {'total_quantity': 'Total quantity cannot be negative.'}
            )
        if data.get('available_quantity', 0) < 0:
            raise serializers.ValidationError(
                {'available_quantity': 'Available quantity cannot be negative.'}
            )
        return data


# ============================================================================
# BORROWER SERIALIZERS
# ============================================================================

class BorrowerSerializer(serializers.ModelSerializer):
    """Borrower serializer."""
    
    class Meta:
        model = Borrower
        fields = [
            'id', 'borrower_name', 'id_number', 'department_course',
            'contact_number', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if not data.get('borrower_name'):
            raise serializers.ValidationError(
                {'borrower_name': 'Borrower name is required.'}
            )
        if not data.get('id_number'):
            raise serializers.ValidationError(
                {'id_number': 'ID number is required.'}
            )
        return data


# ============================================================================
# BORROW TRANSACTION SERIALIZERS
# ============================================================================

class BorrowTransactionSerializer(serializers.ModelSerializer):
    """Borrow transaction serializer."""
    borrower_name = serializers.CharField(
        source='borrower.borrower_name', read_only=True
    )
    equipment_name = serializers.CharField(
        source='equipment.equipment_name', read_only=True
    )
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = BorrowTransaction
        fields = [
            'id', 'borrower', 'borrower_name', 'equipment', 'equipment_name',
            'quantity_borrowed', 'purpose', 'borrow_date', 'expected_return_date',
            'approved_by', 'checked_by', 'condition_before', 'remarks_before',
            'agreement_accepted', 'status', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_is_overdue(self, obj):
        return obj.is_overdue


class BorrowTransactionListSerializer(serializers.ModelSerializer):
    """Lightweight borrow transaction for list view."""
    borrower_name = serializers.CharField(
        source='borrower.borrower_name', read_only=True
    )
    equipment_name = serializers.CharField(
        source='equipment.equipment_name', read_only=True
    )

    class Meta:
        model = BorrowTransaction
        fields = [
            'id', 'borrower', 'borrower_name', 'equipment', 'equipment_name',
            'quantity_borrowed', 'borrow_date', 'expected_return_date',
            'status', 'created_at'
        ]


# ============================================================================
# RETURN TRANSACTION SERIALIZERS
# ============================================================================

class ReturnTransactionSerializer(serializers.ModelSerializer):
    """Return transaction serializer."""
    borrow_transaction_details = serializers.SerializerMethodField()
    calculated_penalty = serializers.SerializerMethodField()

    class Meta:
        model = ReturnTransaction
        fields = [
            'id', 'borrow_transaction', 'borrow_transaction_details',
            'return_date', 'returned_quantity', 'condition_after',
            'remarks_after', 'checked_by', 'is_late', 'penalty_amount',
            'calculated_penalty', 'final_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_borrow_transaction_details(self, obj):
        bt = obj.borrow_transaction
        return {
            'id': bt.id,
            'borrower_name': bt.borrower.borrower_name,
            'equipment_name': bt.equipment.equipment_name,
            'quantity_borrowed': bt.quantity_borrowed,
            'expected_return_date': bt.expected_return_date,
        }

    def get_calculated_penalty(self, obj):
        return str(obj.calculate_penalty())


class ReturnTransactionListSerializer(serializers.ModelSerializer):
    """Lightweight return transaction for list view."""
    borrower_name = serializers.CharField(
        source='borrow_transaction.borrower.borrower_name', read_only=True
    )
    equipment_name = serializers.CharField(
        source='borrow_transaction.equipment.equipment_name', read_only=True
    )

    class Meta:
        model = ReturnTransaction
        fields = [
            'id', 'borrower_name', 'equipment_name', 'return_date',
            'returned_quantity', 'condition_after', 'penalty_amount',
            'final_status', 'created_at'
        ]


# ============================================================================
# CONDITION LOG SERIALIZERS
# ============================================================================

class ConditionLogSerializer(serializers.ModelSerializer):
    """Condition log serializer."""
    equipment_name = serializers.CharField(
        source='equipment.equipment_name', read_only=True
    )

    class Meta:
        model = ConditionLog
        fields = [
            'id', 'equipment', 'equipment_name', 'transaction_type',
            'condition_status', 'notes', 'checked_by', 'created_at'
        ]
        read_only_fields = ['created_at']


# ============================================================================
# DASHBOARD SERIALIZERS
# ============================================================================

class DashboardStatsSerializer(serializers.Serializer):
    """Dashboard statistics serializer."""
    total_equipment = serializers.IntegerField()
    total_borrowers = serializers.IntegerField()
    total_borrowed_items = serializers.IntegerField()
    total_returned_items = serializers.IntegerField()
    total_overdue_items = serializers.IntegerField()
    total_damaged_items = serializers.IntegerField()
    total_lost_items = serializers.IntegerField()

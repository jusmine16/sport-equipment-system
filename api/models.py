"""
Models for Sport Equipment Borrowing System.
"""
from django.db import models
from django.contrib.auth.models import User
from datetime import date
from decimal import Decimal


class UserProfile(models.Model):
    """Extends User with role field."""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('user', 'User'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_staff(self):
        return self.role in ('admin', 'staff')


class Equipment(models.Model):
    """Sport equipment available for borrowing."""
    CONDITION_CHOICES = [
        ('Good', 'Good'),
        ('Slightly Damaged', 'Slightly Damaged'),
        ('Needs Repair', 'Needs Repair'),
    ]

    equipment_code = models.CharField(max_length=50, unique=True)
    equipment_name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    total_quantity = models.PositiveIntegerField(default=0)
    available_quantity = models.PositiveIntegerField(default=0)
    condition_status = models.CharField(
        max_length=50, 
        choices=CONDITION_CHOICES, 
        default='Good'
    )
    image = models.ImageField(upload_to='equipment/', blank=True, null=True, help_text='Equipment photo')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['equipment_name']
        indexes = [
            models.Index(fields=['equipment_code']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.equipment_code} - {self.equipment_name}"


class Borrower(models.Model):
    """Borrower information."""
    borrower_name = models.CharField(max_length=150)
    id_number = models.CharField(max_length=50, unique=True)
    department_course = models.CharField(max_length=150, blank=True, null=True)
    contact_number = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['borrower_name']
        indexes = [
            models.Index(fields=['id_number']),
        ]

    def __str__(self):
        return f"{self.borrower_name} ({self.id_number})"


class BorrowTransaction(models.Model):
    """Borrow transaction record."""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Borrowed', 'Borrowed'),
        ('Returned', 'Returned'),
        ('Overdue', 'Overdue'),
        ('Damaged', 'Damaged'),
        ('Lost', 'Lost'),
        ('Cancelled', 'Cancelled'),
    ]
    CONDITION_CHOICES = [
        ('Good', 'Good'),
        ('Slightly Damaged', 'Slightly Damaged'),
        ('Needs Repair', 'Needs Repair'),
    ]

    borrower = models.ForeignKey(
        Borrower, 
        on_delete=models.CASCADE, 
        related_name='borrow_transactions'
    )
    equipment = models.ForeignKey(
        Equipment, 
        on_delete=models.CASCADE, 
        related_name='borrow_transactions'
    )
    quantity_borrowed = models.PositiveIntegerField()
    purpose = models.TextField(blank=True, null=True)
    borrow_date = models.DateField()
    expected_return_date = models.DateField()
    approved_by = models.CharField(max_length=150, blank=True, null=True)
    checked_by = models.CharField(max_length=150, blank=True, null=True)
    condition_before = models.CharField(
        max_length=50,
        choices=CONDITION_CHOICES,
        default='Good'
    )
    remarks_before = models.TextField(blank=True, null=True)
    agreement_accepted = models.BooleanField(default=False)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='Pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-borrow_date']
        indexes = [
            models.Index(fields=['borrower', 'status']),
            models.Index(fields=['equipment', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Borrow #{self.id} - {self.borrower.borrower_name} - {self.equipment.equipment_name}"

    @property
    def is_overdue(self):
        """Check if borrow transaction is overdue."""
        if self.status in ('Returned', 'Cancelled'):
            return False
        return date.today() > self.expected_return_date


class ReturnTransaction(models.Model):
    """Return transaction record."""
    CONDITION_CHOICES = [
        ('Good', 'Good'),
        ('Damaged', 'Damaged'),
        ('Lost', 'Lost'),
    ]
    STATUS_CHOICES = [
        ('Returned', 'Returned'),
        ('Damaged', 'Damaged'),
        ('Lost', 'Lost'),
    ]

    borrow_transaction = models.ForeignKey(
        BorrowTransaction,
        on_delete=models.CASCADE,
        related_name='return_transactions'
    )
    return_date = models.DateField(blank=True, null=True)
    returned_quantity = models.PositiveIntegerField(blank=True, null=True)
    condition_after = models.CharField(
        max_length=50,
        choices=CONDITION_CHOICES,
        default='Good'
    )
    remarks_after = models.TextField(blank=True, null=True)
    checked_by = models.CharField(max_length=150, blank=True, null=True)
    is_late = models.BooleanField(default=False)
    penalty_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='Returned'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-return_date']
        indexes = [
            models.Index(fields=['borrow_transaction']),
        ]

    def __str__(self):
        return f"Return #{self.id} - {self.borrow_transaction.borrower.borrower_name}"

    def calculate_penalty(self):
        """Calculate penalty based on days late."""
        if not self.is_late or not self.return_date:
            return Decimal('0')
        
        days_late = (self.return_date - self.borrow_transaction.expected_return_date).days
        
        if days_late == 1:
            return Decimal('20')
        elif days_late <= 3:
            return Decimal('50')
        else:
            return Decimal('100')


class ConditionLog(models.Model):
    """Log of equipment condition changes."""
    TRANSACTION_CHOICES = [
        ('Borrow', 'Borrow'),
        ('Return', 'Return'),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='condition_logs'
    )
    transaction_type = models.CharField(
        max_length=50,
        choices=TRANSACTION_CHOICES,
        blank=True,
        null=True
    )
    condition_status = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    checked_by = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['equipment']),
        ]

    def __str__(self):
        return f"Condition Log #{self.id} - {self.equipment.equipment_name}"

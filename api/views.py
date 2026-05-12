"""
API views for Sport Equipment Borrowing System.
"""
from datetime import date
from django.db import transaction
from django.db.models import Q, Count
from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User

from .models import (
    Equipment,
    Borrower,
    BorrowTransaction,
    ReturnTransaction,
    ConditionLog,
    UserProfile,
)
from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    EquipmentSerializer,
    BorrowerSerializer,
    BorrowTransactionSerializer,
    BorrowTransactionListSerializer,
    ReturnTransactionSerializer,
    ReturnTransactionListSerializer,
    ConditionLogSerializer,
    DashboardStatsSerializer,
)
from .permissions import IsAdminUser, IsStaffUser


# ============================================================================
# AUTHENTICATION & USER ENDPOINTS
# ============================================================================

class RegisterView(APIView):
    """User registration."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {'message': 'User registered successfully', 'user_id': user.id},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    """JWT login - returns access and refresh tokens."""
    permission_classes = [AllowAny]


class UserProfileView(APIView):
    """Get current user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ============================================================================
# EQUIPMENT ENDPOINTS
# ============================================================================

class EquipmentViewSet(viewsets.ModelViewSet):
    """CRUD for equipment - accessible by staff/admin."""
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'condition_status']
    search_fields = ['equipment_code', 'equipment_name', 'category']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(equipment_code__icontains=search) |
                Q(equipment_name__icontains=search) |
                Q(category__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def update_quantity(self, request, pk=None):
        """Update equipment quantity and available quantity."""
        equipment = self.get_object()
        new_quantity = request.data.get('total_quantity')
        
        if new_quantity is None:
            return Response(
                {'error': 'total_quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_quantity = int(new_quantity)
            if new_quantity < 0:
                return Response(
                    {'error': 'Quantity cannot be negative'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update available quantity based on difference
            diff = new_quantity - equipment.total_quantity
            equipment.total_quantity = new_quantity
            equipment.available_quantity = max(0, equipment.available_quantity + diff)
            equipment.save()
            
            serializer = self.get_serializer(equipment)
            return Response(serializer.data)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid quantity value'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================================
# BORROWER ENDPOINTS
# ============================================================================

class BorrowerViewSet(viewsets.ModelViewSet):
    """CRUD for borrowers - accessible by staff/admin."""
    queryset = Borrower.objects.all()
    serializer_class = BorrowerSerializer
    filter_backends = [DjangoFilterBackend]
    search_fields = ['borrower_name', 'id_number', 'department_course']
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(borrower_name__icontains=search) |
                Q(id_number__icontains=search)
            )
        return qs

    @action(detail=True, methods=['get'])
    def borrow_history(self, request, pk=None):
        """Get borrow history for a specific borrower."""
        borrower = self.get_object()
        borrows = borrower.borrow_transactions.all().order_by('-borrow_date')
        serializer = BorrowTransactionListSerializer(borrows, many=True)
        return Response(serializer.data)


# ============================================================================
# BORROW TRANSACTION ENDPOINTS
# ============================================================================

class BorrowTransactionViewSet(viewsets.ModelViewSet):
    """CRUD for borrow transactions - accessible by staff/admin."""
    queryset = BorrowTransaction.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['borrower', 'equipment', 'status']
    search_fields = ['borrower__borrower_name', 'equipment__equipment_name']
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get_serializer_class(self):
        if self.action == 'list':
            return BorrowTransactionListSerializer
        return BorrowTransactionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(borrower__borrower_name__icontains=search) |
                Q(equipment__equipment_name__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        """Create a new borrow transaction with validation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        equipment = serializer.validated_data['equipment']
        quantity = serializer.validated_data['quantity_borrowed']

        # Validate equipment stock
        if equipment.available_quantity < quantity:
            return Response(
                {
                    'error': f'Insufficient stock. Available: {equipment.available_quantity}',
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create transaction and deduct stock
        with transaction.atomic():
            borrow = serializer.save()
            equipment.available_quantity -= quantity
            equipment.save()

            # Create condition log
            ConditionLog.objects.create(
                equipment=equipment,
                transaction_type='Borrow',
                condition_status=borrow.condition_before,
                notes=borrow.remarks_before,
                checked_by=borrow.checked_by
            )

            borrow_serializer = BorrowTransactionSerializer(borrow)
            return Response(borrow_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a pending borrow request."""
        borrow = self.get_object()
        
        if borrow.status != 'Pending':
            return Response(
                {'error': f'Can only approve pending transactions. Status: {borrow.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        borrow.status = 'Approved'
        borrow.approved_by = request.user.full_name or request.user.username
        borrow.save()

        serializer = self.get_serializer(borrow)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm_borrowed(self, request, pk=None):
        """Confirm equipment has been borrowed (staff action)."""
        borrow = self.get_object()
        
        if borrow.status != 'Approved':
            return Response(
                {'error': f'Can only confirm approved transactions'},
                status=status.HTTP_400_BAD_REQUEST
            )

        borrow.status = 'Borrowed'
        borrow.save()

        serializer = self.get_serializer(borrow)
        return Response(serializer.data)


# ============================================================================
# RETURN TRANSACTION ENDPOINTS
# ============================================================================

class ReturnTransactionViewSet(viewsets.ModelViewSet):
    """CRUD for return transactions - accessible by staff/admin."""
    queryset = ReturnTransaction.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['borrow_transaction__borrower', 'final_status']
    search_fields = [
        'borrow_transaction__borrower__borrower_name',
        'borrow_transaction__equipment__equipment_name'
    ]
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get_serializer_class(self):
        if self.action == 'list':
            return ReturnTransactionListSerializer
        return ReturnTransactionSerializer

    def create(self, request, *args, **kwargs):
        """Create a new return transaction."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        borrow = serializer.validated_data['borrow_transaction']
        returned_qty = serializer.validated_data.get('returned_quantity', borrow.quantity_borrowed)

        # Check if return is late
        is_late = serializer.validated_data.get('return_date', date.today()) > borrow.expected_return_date
        
        with transaction.atomic():
            return_tx = serializer.save()
            return_tx.is_late = is_late
            
            # Calculate penalty if late
            if is_late:
                return_tx.penalty_amount = return_tx.calculate_penalty()
            
            return_tx.save()

            # Update borrow transaction status
            borrow.status = return_tx.final_status
            borrow.save()

            # Update equipment available quantity
            equipment = borrow.equipment
            equipment.available_quantity += returned_qty
            equipment.save()

            # Create condition log
            ConditionLog.objects.create(
                equipment=equipment,
                transaction_type='Return',
                condition_status=return_tx.condition_after,
                notes=return_tx.remarks_after,
                checked_by=return_tx.checked_by
            )

            return_serializer = ReturnTransactionSerializer(return_tx)
            return Response(return_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def overdue_items(self, request):
        """Get all overdue borrowings."""
        overdue = BorrowTransaction.objects.filter(
            status='Borrowed',
            expected_return_date__lt=date.today()
        )
        serializer = BorrowTransactionListSerializer(overdue, many=True)
        return Response(serializer.data)


# ============================================================================
# CONDITION LOG ENDPOINTS
# ============================================================================

class ConditionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to condition logs."""
    queryset = ConditionLog.objects.all()
    serializer_class = ConditionLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment', 'transaction_type']
    permission_classes = [IsAuthenticated, IsStaffUser]

    @action(detail=False, methods=['get'])
    def by_equipment(self, request):
        """Get condition logs for a specific equipment."""
        equipment_id = request.query_params.get('equipment_id')
        if not equipment_id:
            return Response(
                {'error': 'equipment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = ConditionLog.objects.filter(equipment_id=equipment_id).order_by('-created_at')
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


# ============================================================================
# DASHBOARD ENDPOINTS
# ============================================================================

class DashboardStatsView(APIView):
    """Dashboard statistics endpoint."""
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        """Get dashboard statistics."""
        total_equipment = Equipment.objects.count()
        total_borrowers = Borrower.objects.count()
        total_borrowed_items = BorrowTransaction.objects.filter(status='Borrowed').count()
        total_returned_items = ReturnTransaction.objects.count()
        total_overdue_items = BorrowTransaction.objects.filter(
            status='Borrowed',
            expected_return_date__lt=date.today()
        ).count()
        total_damaged_items = BorrowTransaction.objects.filter(status='Damaged').count()
        total_lost_items = BorrowTransaction.objects.filter(status='Lost').count()

        data = {
            'total_equipment': total_equipment,
            'total_borrowers': total_borrowers,
            'total_borrowed_items': total_borrowed_items,
            'total_returned_items': total_returned_items,
            'total_overdue_items': total_overdue_items,
            'total_damaged_items': total_damaged_items,
            'total_lost_items': total_lost_items,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class ReportsView(APIView):
    """Reports and analytics."""
    permission_classes = [IsAuthenticated, IsStaffUser]

    @action(detail=False, methods=['get'])
    def overdue_report(self, request):
        """Get overdue borrowing report."""
        overdue = BorrowTransaction.objects.filter(
            status='Borrowed',
            expected_return_date__lt=date.today()
        ).select_related('borrower', 'equipment')

        data = []
        for borrow in overdue:
            days_overdue = (date.today() - borrow.expected_return_date).days
            data.append({
                'id': borrow.id,
                'borrower_name': borrow.borrower.borrower_name,
                'equipment_name': borrow.equipment.equipment_name,
                'borrow_date': borrow.borrow_date,
                'expected_return_date': borrow.expected_return_date,
                'days_overdue': days_overdue,
                'quantity': borrow.quantity_borrowed,
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def damaged_equipment_report(self, request):
        """Get damaged and lost equipment report."""
        damaged_borrows = BorrowTransaction.objects.filter(status='Damaged')
        lost_borrows = BorrowTransaction.objects.filter(status='Lost')

        data = {
            'damaged': BorrowTransactionListSerializer(damaged_borrows, many=True).data,
            'lost': BorrowTransactionListSerializer(lost_borrows, many=True).data,
        }

        return Response(data)

    @action(detail=False, methods=['get'])
    def borrowing_summary(self, request):
        """Get summary statistics by equipment and borrower."""
        # Equipment summary
        equipment_summary = Equipment.objects.annotate(
            total_borrowed=Count('borrow_transactions')
        ).values('equipment_code', 'equipment_name', 'total_quantity', 'available_quantity', 'total_borrowed')

        # Borrower summary
        borrower_summary = Borrower.objects.annotate(
            total_borrows=Count('borrow_transactions')
        ).values('borrower_name', 'id_number', 'total_borrows')

        return Response({
            'equipment': list(equipment_summary),
            'borrowers': list(borrower_summary),
        })

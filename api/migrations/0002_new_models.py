# Generated migration for new borrowing system models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        # Drop old models
        migrations.DeleteModel(
            name='BorrowItem',
        ),
        migrations.DeleteModel(
            name='BorrowRequest',
        ),
        migrations.DeleteModel(
            name='Transaction',
        ),

        # Update Equipment model
        migrations.RemoveField(
            model_name='equipment',
            name='description',
        ),
        migrations.RemoveField(
            model_name='equipment',
            name='status',
        ),
        migrations.RemoveField(
            model_name='equipment',
            name='condition',
        ),
        migrations.AlterField(
            model_name='equipment',
            name='name',
            field=models.CharField(max_length=200),
        ),
        migrations.AddField(
            model_name='equipment',
            name='equipment_code',
            field=models.CharField(max_length=50, unique=True, default='placeholder'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='equipment',
            name='equipment_name',
            field=models.CharField(max_length=150, default='placeholder'),
        ),
        migrations.AddField(
            model_name='equipment',
            name='condition_status',
            field=models.CharField(
                choices=[('Good', 'Good'), ('Slightly Damaged', 'Slightly Damaged'), ('Needs Repair', 'Needs Repair')],
                default='Good',
                max_length=50
            ),
        ),
        migrations.AddField(
            model_name='equipment',
            name='remarks',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='equipment',
            name='quantity',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RenameField(
            model_name='equipment',
            old_name='quantity',
            new_name='total_quantity',
        ),
        migrations.RenameField(
            model_name='equipment',
            old_name='category',
            new_name='category',
        ),
        migrations.RemoveField(
            model_name='equipment',
            name='name',
        ),
        migrations.AddIndex(
            model_name='equipment',
            index=models.Index(fields=['equipment_code'], name='api_equipme_equipme_idx'),
        ),
        migrations.AddIndex(
            model_name='equipment',
            index=models.Index(fields=['category'], name='api_equipme_categor_idx'),
        ),

        # Add UserProfile staff role
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Admin'), ('staff', 'Staff'), ('user', 'User')],
                default='user',
                max_length=10
            ),
        ),

        # Create Borrower model
        migrations.CreateModel(
            name='Borrower',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('borrower_name', models.CharField(max_length=150)),
                ('id_number', models.CharField(max_length=50, unique=True)),
                ('department_course', models.CharField(blank=True, max_length=150, null=True)),
                ('contact_number', models.CharField(blank=True, max_length=30, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['borrower_name'],
            },
        ),
        migrations.AddIndex(
            model_name='borrower',
            index=models.Index(fields=['id_number'], name='api_borrowe_id_numb_idx'),
        ),

        # Create BorrowTransaction model
        migrations.CreateModel(
            name='BorrowTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_borrowed', models.PositiveIntegerField()),
                ('purpose', models.TextField(blank=True, null=True)),
                ('borrow_date', models.DateField()),
                ('expected_return_date', models.DateField()),
                ('approved_by', models.CharField(blank=True, max_length=150, null=True)),
                ('checked_by', models.CharField(blank=True, max_length=150, null=True)),
                ('condition_before', models.CharField(
                    choices=[('Good', 'Good'), ('Slightly Damaged', 'Slightly Damaged'), ('Needs Repair', 'Needs Repair')],
                    default='Good',
                    max_length=50
                )),
                ('remarks_before', models.TextField(blank=True, null=True)),
                ('agreement_accepted', models.BooleanField(default=False)),
                ('status', models.CharField(
                    choices=[
                        ('Pending', 'Pending'), ('Approved', 'Approved'), ('Borrowed', 'Borrowed'),
                        ('Returned', 'Returned'), ('Overdue', 'Overdue'), ('Damaged', 'Damaged'),
                        ('Lost', 'Lost'), ('Cancelled', 'Cancelled')
                    ],
                    default='Pending',
                    max_length=50
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('borrower', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='borrow_transactions', to='api.borrower')),
                ('equipment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='borrow_transactions', to='api.equipment')),
            ],
            options={
                'ordering': ['-borrow_date'],
            },
        ),
        migrations.AddIndex(
            model_name='borrowtransaction',
            index=models.Index(fields=['borrower', 'status'], name='api_borrowt_borrowe_status_idx'),
        ),
        migrations.AddIndex(
            model_name='borrowtransaction',
            index=models.Index(fields=['equipment', 'status'], name='api_borrowt_equipme_status_idx'),
        ),
        migrations.AddIndex(
            model_name='borrowtransaction',
            index=models.Index(fields=['status'], name='api_borrowt_status_idx'),
        ),

        # Create ReturnTransaction model
        migrations.CreateModel(
            name='ReturnTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('return_date', models.DateField(blank=True, null=True)),
                ('returned_quantity', models.PositiveIntegerField(blank=True, null=True)),
                ('condition_after', models.CharField(
                    choices=[('Good', 'Good'), ('Damaged', 'Damaged'), ('Lost', 'Lost')],
                    default='Good',
                    max_length=50
                )),
                ('remarks_after', models.TextField(blank=True, null=True)),
                ('checked_by', models.CharField(blank=True, max_length=150, null=True)),
                ('is_late', models.BooleanField(default=False)),
                ('penalty_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('final_status', models.CharField(
                    choices=[('Returned', 'Returned'), ('Damaged', 'Damaged'), ('Lost', 'Lost')],
                    default='Returned',
                    max_length=50
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('borrow_transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='return_transactions', to='api.borrowtransaction')),
            ],
            options={
                'ordering': ['-return_date'],
            },
        ),
        migrations.AddIndex(
            model_name='returntransaction',
            index=models.Index(fields=['borrow_transaction'], name='api_returnt_borrowt_idx'),
        ),

        # Create ConditionLog model
        migrations.CreateModel(
            name='ConditionLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('transaction_type', models.CharField(blank=True, choices=[('Borrow', 'Borrow'), ('Return', 'Return')], max_length=50, null=True)),
                ('condition_status', models.CharField(blank=True, max_length=50, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('checked_by', models.CharField(blank=True, max_length=150, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('equipment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='condition_logs', to='api.equipment')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='conditionlog',
            index=models.Index(fields=['equipment'], name='api_conditio_equipme_idx'),
        ),
    ]

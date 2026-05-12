"""
Management command to create an admin user.
Usage: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile


class Command(BaseCommand):
    help = 'Create an admin user for the Sport Equipment Borrowing System'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin', help='Admin username')
        parser.add_argument('--password', default='admin123', help='Admin password')
        parser.add_argument('--email', default='admin@example.com', help='Admin email')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email}
        )
        user.set_password(password)
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = 'admin'
        profile.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Admin user "{username}" created successfully.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'User "{username}" updated to admin.'))

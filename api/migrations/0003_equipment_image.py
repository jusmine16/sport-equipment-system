# Generated migration for equipment image field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_new_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='equipment',
            name='image',
            field=models.ImageField(blank=True, help_text='Equipment photo', null=True, upload_to='equipment/'),
        ),
    ]

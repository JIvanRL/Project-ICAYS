# Generated by Django 5.1.6 on 2025-03-26 20:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ICAYS_BIT', '0012_tableblanco_remove_direct_o_dilucion_placa_blanco_dd_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clavemuestracbap',
            name='cantidad_blanco_c_m',
        ),
    ]

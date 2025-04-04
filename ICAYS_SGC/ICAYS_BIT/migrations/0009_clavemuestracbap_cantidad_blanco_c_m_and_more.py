# Generated by Django 5.1.6 on 2025-03-26 19:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ICAYS_BIT', '0008_clavemuestracbap_medicion_c_m'),
    ]

    operations = [
        migrations.AddField(
            model_name='clavemuestracbap',
            name='cantidad_blanco_c_m',
            field=models.CharField(blank=True, db_column='cantidad_blanco_c_m', default='-', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='dilucion',
            name='placa_blanco_d',
            field=models.CharField(blank=True, db_column='placa_blanco_d', default='---', max_length=250, null=True),
        ),
        migrations.AddField(
            model_name='resultado',
            name='resultado_blanco_r',
            field=models.CharField(blank=True, db_column='resultado_blanco_r', max_length=250, null=True),
        ),
    ]

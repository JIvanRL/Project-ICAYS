# Generated by Django 5.1.6 on 2025-03-31 21:45

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ICAYS_BIT', '0015_ejemplosformulas'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ejemplosformulas',
            name='nombre_bita_cbap',
            field=models.ForeignKey(db_column='nombre_bita_cbap_ejemplos', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nombre_bita_cbap', to='ICAYS_BIT.bita_cbap'),
        ),
    ]

# Generated by Django 5.1.6 on 2025-04-07 17:22

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ICAYS_BIT', '0017_notification_pushsubscription'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='bita_cbap',
            name='fecha_lectura_cbap',
        ),
        migrations.RemoveField(
            model_name='bita_cbap',
            name='hora_lectura_cbap',
        ),
        migrations.CreateModel(
            name='Lecturas',
            fields=[
                ('id_lectura', models.AutoField(db_column='id_lectura', primary_key=True, serialize=False)),
                ('fecha_lectura', models.CharField(blank=True, db_column='fecha_lectura', default='---', max_length=50, null=True)),
                ('hora_lectura', models.CharField(blank=True, db_column='hora_lectura', default='---', max_length=50, null=True)),
                ('nombre_bita_cbap', models.ForeignKey(db_column='nombre_bita_cbap_lecturas', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lecturas', to='ICAYS_BIT.bita_cbap')),
            ],
            options={
                'db_table': 'lecturas',
                'ordering': ['-fecha_lectura', '-hora_lectura'],
            },
        ),
    ]

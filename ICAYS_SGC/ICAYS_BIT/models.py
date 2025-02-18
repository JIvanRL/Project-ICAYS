from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.hashers import make_password

#############
# Clase Área #
#############
class Area(models.Model):
    id_area = models.AutoField(primary_key=True, db_column='id_area')
    name_area = models.CharField(max_length=250, db_column='name_area')

    class Meta:
        db_table = 'areas'  

    def __str__(self):
        return self.name_area

#############
# Clase Rol #
#############
class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True, db_column='id_rol')
    name_rol = models.CharField(max_length=250, db_column='name_rol')

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.name_rol

#########################
# Custom User Manager #
#########################
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)  # Hashea la contraseña antes de guardarla
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(username, email, password, **extra_fields)

#####################
# Clase de Usuario #
#####################
class CustomUser(AbstractUser):
    # Campos personalizados
    id_user = models.AutoField(primary_key=True, db_column='id_user')
    first_name = models.CharField(max_length=150, db_column='name_user')
    last_name = models.CharField(max_length=150, db_column='last_name_user')

    # Relación con Área
    area_user = models.ForeignKey(
        Area,
        on_delete=models.SET_NULL,
        null=True,
        db_column='area_user',
        related_name='users'
    )

    signature_user = models.CharField(max_length=250, db_column='signature_user')

    # Relación con Rol
    rol_user = models.ForeignKey(
        Rol,
        on_delete=models.SET_NULL,
        null=True,
        db_column='rol_user',
        related_name='users'
    )

    email = models.EmailField(max_length=254, unique=True, db_column='gmail_user')
    username = models.CharField(max_length=150, unique=True, db_column='nameUs_user')
    password = models.CharField(max_length=128, db_column='pass_user')

    # Campos adicionales requeridos por Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()  # Usar el nuevo UserManager
     # Relación con grupos
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_groups',  # Cambiar el related_name
        blank=True
    )

    # Relación con permisos de usuario
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_permissions',  # Cambiar el related_name
        blank=True
    )

    class Meta:
        db_table = 'users'

    def save(self, *args, **kwargs):
        """ Hashea la contraseña si no está ya hasheada """
        if not self.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2$')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)


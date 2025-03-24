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
    objects = CustomUserManager()
    # Métodos requeridos por Django
    class Meta:
        db_table = 'users'

    def save(self, *args, **kwargs):
        """ Hashea la contraseña si no está ya hasheada """
        if not self.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2$')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)
############################
#Tabla dilusiones empleadas#
############################
class DilucionesEmpleadas(models.Model):
    id_dE = models.AutoField(primary_key=True, db_column='id_d')
    id_cbap_dE = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_dE',
        related_name='dilucion_empleadas'
    )
    dE_1 = models.FloatField(null=True, default=0.0, db_column='dE_1')
    dE_2 = models.FloatField(null=True, default=0.00, db_column='dE_2')
    dE_3 = models.FloatField(null=True, default=0.000, db_column='dE_3')
    dE_4 = models.FloatField(null=True, default=0.000, db_column='dE_4')

    class Meta:
        db_table = 'diluciones_empleadas'
##########################
#Tabla dilusion o directa#
##########################
class Direct_o_Dilucion(models.Model):
    id_dD = models.AutoField(primary_key=True, db_column='id_dD')
    id_cbap_dD = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_dD',
        related_name='dilucion_directa'
    )
    placa_dD = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='placa_dD')
    placa_dD2 = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='placa_dD2')
    promedio_dD = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='promedio_dD')

    class Meta:
        db_table = 'direct_o_dilucion'
################
#Tabla dilusion#
################
class Dilucion(models.Model):
    id_d = models.AutoField(primary_key=True, db_column='id_d')
    id_cbap_d = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_d',
        related_name='dilucion'
    ) 
    placa_d = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='placa_d')
    placa_d2 = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='placa_d2')
    promedio_d = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='promedio_d')
    placa_d_2 = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='placa_d_2')
    placa_d2_2 = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='placa_d2_2')
    promedio_d_2 = models.DecimalField(null=True, max_digits=10, decimal_places=5, default=None,blank=True, db_column='promedio_d_2')

    class Meta:
        db_table = 'dilucion'

############################################
#Tabla cumplimiento de controles de calidad#
############################################
class ControlCalidad(models.Model):
    id_cc = models.AutoField(primary_key=True, db_column='id_cc')
    nombre_laf = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='nombre_laf')
    fecha_1cc = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='fecha_1cc')
    page_1cc = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='page_1cc')
    id_cbap_cc = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_cc',
        related_name='control_calidades'
    )    
    class Meta:
        db_table = 'Control_calidad'
        verbose_name = 'Control de Calidad'  # Nombre legible en el admin de Django
        verbose_name_plural = 'Controles de Calidad'  # Nombre plural en el admin de Django
#########################
#Verificación de balanza#
#########################
class VerificacionBalanza(models.Model):
    id_vb = models.AutoField(primary_key=True, db_column='id_cc')
    id_cbap_vb = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_vb',
        related_name='verificaciones_balanza'
    )
    hora_vb = models.CharField(null=True, max_length=50, blank=True, db_column='hora_vb')
    actividad_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='actividad_vb')
    ajuste_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='ajuste_vb')
    valor_nominal_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='valor_nominal_vb')
    valor_convencional_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='valor_convencional_vb')
    valo_masa_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='valo_masa_vb')
    diferecnia_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='diferecnia_vb')
    incertidumbre_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='incertidumbre_vb')
    emt_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='emt_vb')
    aceptacion_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='aceptacion_vb')
    valor_pesado_muestra_vb = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='valor_pesado_muestra_vb')
    fecha_vb = models.DateField(auto_now_add=True)   

    class Meta:
        db_table = 'verificacion_balanza'
###################################
#Clave muestra para los resultados#
###################################
class ClaveMuestraCbap(models.Model):
    id_c_m = models.AutoField(primary_key=True, db_column='id_c_m')
    id_cbap_c_m = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_c_m',
        related_name='ClaveMuestra'
    )
    fecha_c_m = models.DateTimeField(auto_now_add=True)
    clave_c_m = models.CharField(null=True, max_length=50, default='-', blank=True, db_column='clave_c_m')
    cantidad_c_m = models.CharField(null=True, max_length=50, default='-', blank=True, db_column='cantidad_c_m')

    class Meta:
        db_table = 'clave_muestra'

#############
#Datos campo#
#############
class DatosCampoCbap(models.Model):
    id_dc = models.AutoField(primary_key=True, db_column='id_dc')
    fecha_siembra_dc = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='fecha_siembra_dc')
    hora_siembra_dc = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='hora_siembra_dc')
    hora_incubacion_dc = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='hora_incubacion_dc')
    procedimiento_dc = models.CharField(null=True, max_length=50, default='-', blank=True, db_column='procedimiento_dc')
    equipo_incubacion_dc = models.CharField(null=True, max_length=50, default='-', blank=True, db_column='equipo_incubacion_dc')

    class Meta:
        db_table = 'datos_campo'
#################
#Tabla resultado#
#################
class Resultado(models.Model):
    id_r = models.AutoField(primary_key=True, db_column='id_r')
    id_cbap_r = models.ForeignKey(
        'bita_cbap',
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_cbap_r',
        related_name='resultado'
    )
    resultado_r = models.CharField(null=True, max_length=250, blank=True, db_column='resultado_r')
    ufC_placa_r = models.CharField(null=True, max_length=250,  blank=True, db_column='ufC_placa_r')
    diferencia_r = models.CharField(null=True, max_length=250,  blank=True, db_column='diferencia_r')
    class Meta:
        db_table = 'resultado_pro'
################################
#Tabla bitacora microbiologia 2#
################################
class bita_cbap(models.Model):
    id_cbap = models.AutoField(primary_key=True, db_column='id_cbap')
    nombre_cbap = models.CharField(null=True, max_length=250, default='-', blank=True, db_column='nombre_cbap')
    pagina_cbap = models.IntegerField(null=True, default=0, db_column='pagina_cbap')
    fecha_register_cbap = models.DateField(auto_now_add=True)
    hora_register_cbap = models.TimeField(auto_now_add=True)
    id_dc_cbap = models.ForeignKey(
        DatosCampoCbap,
        on_delete=models.SET_NULL,
        null=True,
        db_column='id_dc',
        related_name='bita_cbap'
    )
    letra_analista_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='numero_analista_cbap')
    mes_muestra_cbap = models.CharField(null=True, max_length=250, default='-', blank=True, db_column='mes_muestra_cbap')
    pagina_muestra_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='pagina_muestra_cbap')
    pagina_fosfato_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='pagina_fosfato_cbap')
    numero_fosfato_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='numero_fosfato_cbap')
    pagina_agar_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='pagina_agar_cbap')
    numero_agar_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='numero_agar_cbap')
    fecha_lectura_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='fecha_lectura_cbap')
    hora_lectura_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='hora_lectura_cbap')
    observaciones_cbap = models.TextField(null=True, default='-', blank=True, db_column='observaciones_cbap')
    firma_user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        db_column='signature_user',
        related_name='bita_cbap'
    )
    class Meta:
        db_table = 'bita_cbap'
        ordering = ['-fecha_register_cbap', '-hora_register_cbap']

    def __str__(self):
        return f"{self.nombre_cbap} - {self.fecha_register_cbap}"

###############
#Tabla general#
###############
class Bitcoras_Cbap(models.Model):
    ESTADOS = (
        ('guardada', 'Guardada'),
        ('enviada', 'Enviada'),
        ('revisada', 'Revisada'),
        ('autorizada', 'Autorizada'),
        ('rechazada', 'Rechazada'),
    )
    id_bita_cbap = models.AutoField(primary_key=True, db_column='id_bita_cbap')
    
    # Relación con nombre usuario de users (destinatario)
    name_user_cbap = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        null=True,
        db_column='name_user_cbap',
        related_name='bitcoras_cbap'
    )
    
    # Relación con nombre usuario de users
    nombre_bita_cbap = models.ForeignKey(
        bita_cbap,
        on_delete=models.SET_NULL,
        null=True,
        db_column='nombre_bita_cbap',
        related_name='bitcoras_cbap'
    )
    fecha_bita_cbap = models.DateTimeField(auto_now=True, db_column='fecha_bita_cbap')
    fecha_envio = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='guardada')
    nombre_user_destino = models.CharField(max_length=250, default='-', blank=True, db_column='nombre_user_destino')
    observaciones_cbap_estado = models.TextField(null=True, default='-', blank=True, db_column='observaciones')
    
    # Nuevo campo para la firma del revisor
    firma_revisor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='firma_revisor',
        related_name='bitcoras_cbap_revisadas'
    )
    
    # Fecha de revisión
    fecha_revision = models.DateTimeField(null=True, blank=True)
    
    # Nuevo campo para la firma del autorizador
    firma_autorizador = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='firma_autorizador',
        related_name='bitcoras_cbap_autorizadas'
    )
    
    # Fecha de autorización
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bitcoras_cbap'

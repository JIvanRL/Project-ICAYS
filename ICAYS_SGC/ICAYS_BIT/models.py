from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.hashers import make_password
from django.utils import timezone

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
    dE_1 = models.FloatField(null=True,blank=True, default=0.0, db_column='dE_1')
    dE_2 = models.FloatField(null=True,blank=True, default=0.00, db_column='dE_2')
    dE_3 = models.FloatField(null=True,blank=True, default=0.000, db_column='dE_3')
    dE_4 = models.FloatField(null=True,blank=True, default=0.000, db_column='dE_4')

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
    placa_dD = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_dD')
    placa_dD2 = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_dD2')
    promedio_dD = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='promedio_dD')
   
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
    placa_d = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_d')
    placa_d2 = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_d2')
    promedio_d = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='promedio_d')
    placa_d_2 = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_d_2')
    placa_d2_2 = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_d2_2')
    promedio_d_2 = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='promedio_d_2')
    
    class Meta:
        db_table = 'dilucion'

############################################
#Tabla cumplimiento de controles de calidad#
############################################
class ControlCalidad(models.Model):
    id_cc = models.AutoField(primary_key=True, db_column='id_cc')
    nombre_laf = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='nombre_laf')
    mes_1cc =  models.CharField(null=True, max_length=50, default='---', blank=True, db_column='mes_1cc')
    anio_1cc =  models.CharField(null=True, max_length=50, default='---', blank=True, db_column='anio_1cc')
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
    hora_vb = models.TimeField(null=True, blank=True, db_column='hora_vb')
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
    mes_verficacion_vb  = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='mes_verficacion_vb')
    anio_verficacion_vb  = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='anio_verficacion_vb')
    pagina_verficacion_vb  = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='pagina_verficacion_vb')

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
    medicion_c_m = models.CharField(null=True, max_length=50, default='-', blank=True, db_column='medicion_c_m')
    cantidad_c_m = models.CharField(null=True, max_length=50, default='-', blank=True, db_column='cantidad_c_m')
    class Meta:
        db_table = 'clave_muestra'

#############
#Datos campo#
#############
class DatosCampoCbap(models.Model):
    id_dc = models.AutoField(primary_key=True, db_column='id_dc')
   # Corrección en models.py
    fecha_siembra_dc = models.DateField(null=True, blank=True, db_column='fecha_siembra_dc')
    hora_siembra_dc = models.TimeField(null=True, blank=True, db_column='hora_siembra_dc')
    hora_incubacion_dc = models.TimeField(null=True, blank=True, db_column='hora_incubacion_dc')
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
    año_muestra_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='año_muestra_cbap')
    mes_muestra_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='mes_muestra_cbap')
    pagina_muestra_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='pagina_muestra_cbap')
    pagina_fosfato_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='pagina_fosfato_cbap')
    numero_fosfato_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='numero_fosfato_cbap')
    pagina_agar_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='pagina_agar_cbap')
    numero_agar_cbap = models.CharField(null=True, max_length=250, default='---', blank=True, db_column='numero_agar_cbap')
    observaciones_cbap = models.TextField(null=True, default='---', blank=True, db_column='observaciones_cbap')
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
        
class ObservacionCampo(models.Model):
    id_valor_editado = models.AutoField(primary_key=True, db_column='id_valor_editado')
    bitacora = models.ForeignKey(
        Bitcoras_Cbap, 
        on_delete=models.CASCADE,
        related_name='valores_editados',
        db_column='bitacora_id'
    )
    campo_id = models.CharField(max_length=255, db_column='campo_id')  # ID del campo en el formulario
    campo_nombre = models.CharField(max_length=255, db_column='campo_nombre')  # Nombre legible del campo
    valor_original = models.TextField(null=True, max_length=250, blank=True, db_column='valor_original')  # Valor original del campo
    valor_actual = models.TextField(null=True, max_length=250, blank=True, db_column='valor_actual')  # Nuevo campo para el valor actual
    campo_tipo = models.TextField(null=True, max_length=250, blank=True, db_column='campo_tipo')  # Tipo del campo
    fecha_edicion = models.DateTimeField(auto_now=True, db_column='fecha_edicion')  # Cambiado a auto_now para actualizar en cada edición
    observacion = models.CharField(null=True, max_length=250, blank=True, db_column='observacion')
    
    # Usuario que agregó la observación (jefe/revisor que rechazó)
    # Agregar un valor predeterminado o permitir valores nulos
    observacion_por = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE,
        related_name='observaciones_realizadas',
        db_column='observacion_por',
        null=True,  # Permitir valores nulos temporalmente
        default=1   # ID del usuario administrador o un usuario que exista seguro
    )
    
    # Usuario que realizó la última edición
    editado_por = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE,
        related_name='valores_editados',
        db_column='editado_por',
        null=True,
        blank=True
    )
    
    # Estado de la observación
    ESTADOS = (
        ('pendiente', 'Pendiente de edición'),
        ('editado', 'Editado'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado nuevamente'),
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente', db_column='estado')
    
    # Nuevos campos para el historial de ediciones
    historial_ediciones = models.JSONField(null=True, blank=True, db_column='historial_ediciones', 
                                          help_text="Historial de ediciones en formato JSON")
    contador_ediciones = models.PositiveIntegerField(default=0, db_column='contador_ediciones',
                                                   help_text="Contador de veces que se ha editado este campo")

    class Meta:
        db_table = 'valores_editados'
        unique_together = ('bitacora', 'campo_id')  # Un campo solo puede tener un valor editado por bitácora
        ordering = ['-fecha_edicion']
    
    def __str__(self):
        return f"Valor editado para {self.campo_nombre} en bitácora {self.bitacora.id_bita_cbap}"
    
    def save(self, *args, **kwargs):
        """
        Sobrescribe el método save para actualizar el historial de ediciones
        cada vez que se modifica el valor del campo.
        """
        # Verificar si es una instancia nueva o existente
        is_new = self.pk is None
        
        # Si es una instancia existente, obtener el objeto anterior
        if not is_new:
            try:
                old_instance = ObservacionCampo.objects.get(pk=self.pk)
                old_valor = old_instance.valor_actual
                
                # Si el valor ha cambiado, actualizar el historial
                if old_valor != self.valor_actual:
                    # Inicializar historial si es None
                    if self.historial_ediciones is None:
                        self.historial_ediciones = []
                    
                    # Agregar entrada al historial
                    nueva_entrada = {
                        'fecha': timezone.now().isoformat(),
                        'valor_anterior': old_valor,
                        'valor_nuevo': self.valor_actual,
                        'usuario_id': self.editado_por.id_user if self.editado_por else None,
                        'usuario_nombre': f"{self.editado_por.first_name} {self.editado_por.last_name}" if self.editado_por else "Sistema",
                        'estado': self.estado
                    }
                    
                    # Agregar la entrada al historial
                    self.historial_ediciones.append(nueva_entrada)
                    
                    # Incrementar contador
                    self.contador_ediciones += 1
            except ObservacionCampo.DoesNotExist:
                pass
        else:
            # Si es una nueva instancia, inicializar el historial
            self.historial_ediciones = [{
                'fecha': timezone.now().isoformat(),
                'valor_anterior': self.valor_original,
                'valor_nuevo': self.valor_actual,
                'usuario_id': self.editado_por.id_user if self.editado_por else None,
                'usuario_nombre': f"{self.editado_por.first_name} {self.editado_por.last_name}" if self.editado_por else "Sistema",
                'estado': self.estado
            }]
            self.contador_ediciones = 1
        
        # Llamar al método save original
        super().save(*args, **kwargs)
###################
#Tabla de muestras#
###################
class tableBlanco(models.Model):
    id_blanco = models.AutoField(primary_key=True, db_column='id_blanco')
    cantidad_blanco = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='cantidad_blanco')
    placa_blanco = models.CharField(null=True, max_length=250, default='---',blank=True, db_column='placa_blanco')
    resultado_blanco = models.CharField(null=True, max_length=250, blank=True, db_column='resultado_blanco')
     # Relación con nombre usuario de users
    nombre_bita_cbap = models.ForeignKey(
        bita_cbap,
        on_delete=models.SET_NULL,
        null=True,
        db_column='nombre_bita_cbap_blancos',
        related_name='muestras_blancos'
    )
    class Meta:
        db_table = 'blancos_cbap'
###################
#Tabla de ejemplos#
###################

class ejemplosFormulas(models.Model):
    id_ejemplos = models.AutoField(primary_key=True, db_column='id_ejemplos')
    dato1_ejemplo = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='dato1_ejemplo')
    dato2_ejemplo = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='dato2_ejemplo')
    dato3_ejemplo = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='dato3_ejemplo')
    resultdo_ejemplo = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='resultdo_ejemplo')
    clave_muestra_ejemplo = models.CharField(null=True, max_length=50, default='---', blank=True, db_column='clave_muestra_ejemplo')
     # Relación con nombre usuario de users
    nombre_bita_cbap = models.ForeignKey(
        bita_cbap,
        on_delete=models.SET_NULL,
        null=True,
        db_column='nombre_bita_cbap_ejemplos',
        related_name='nombre_bita_cbap'
    )
    class Meta:
        db_table = 'ejemplos_cbap'
###################
#Tabla de lecturas#
###################
class Lecturas(models.Model):
    id_lectura = models.AutoField(primary_key=True, db_column='id_lectura')
    fecha_lectura_1 = models.DateField(null=True, blank=True, db_column='fecha_lectura_1')
    hora_lectura_1 = models.TimeField(null=True, blank=True, db_column='hora_lectura_1')
    fecha_lectura_2 = models.DateField(null=True, blank=True, db_column='fecha_lectura_2')
    hora_lectura_2 = models.TimeField(null=True, blank=True, db_column='hora_lectura_2')
    # Relación con nombre usuario de users
    nombre_bita_cbap = models.ForeignKey(
        bita_cbap,
        on_delete=models.SET_NULL,
        null=True,
        db_column='nombre_bita_cbap_lecturas',
        related_name='lecturas'
    )
    
    class Meta:
        db_table = 'lecturas'
# ICAYS_SGC/ICAYS_BIT/models.py
# Añadir esto a tu archivo models.py

class Notification(models.Model):
    id_notification = models.AutoField(primary_key=True, db_column='id_notification')
    message = models.CharField(max_length=255, db_column='message')
    is_read = models.BooleanField(default=False, db_column='is_read')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    type = models.CharField(max_length=50, default='general', db_column='type')  # Nuevo campo
    recipient = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='notifications',
        db_column='recipient'
    )
    related_bitacora = models.ForeignKey(  # Nuevo campo
        Bitcoras_Cbap,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        db_column='related_bitacora'
    )
    related_ejemplo = models.ForeignKey(
        ejemplosFormulas,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        db_column='related_ejemplo'
    )
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notification {self.id_notification} for {self.recipient}"

##############################
# Tabla de suscripciones push#
##############################
        
class PushSubscription(models.Model):
    id_subscription = models.AutoField(primary_key=True, db_column='id_subscription')
    user = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
        db_column='user'
    )
    endpoint = models.TextField(db_column='endpoint')
    p256dh = models.TextField(db_column='p256dh')  # Clave pública
    auth = models.TextField(db_column='auth')  # Clave de autenticación
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    updated_at = models.DateTimeField(auto_now=True, db_column='updated_at')
    
    class Meta:
        db_table = 'push_subscriptions'
        unique_together = ('user', 'endpoint')
    
    def __str__(self):
        return f"Push Subscription for {self.user.username} ({self.endpoint[:30]}...)"
    

class SolicitudAutorizacion(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    )

    id_solicitud = models.AutoField(primary_key=True, db_column='id_solicitud')
    
    bitacora = models.ForeignKey(
        Bitcoras_Cbap,
        on_delete=models.CASCADE,
        related_name='solicitudes_autorizacion',
        db_column='bitacora_id'
    )
    
    campo_id = models.CharField(
        max_length=100,
        db_column='campo_id',
        help_text="ID del campo que requiere autorización"
    )
    
    campo_nombre = models.CharField(
        max_length=255,
        db_column='campo_nombre',
        help_text="Nombre descriptivo del campo"
    )
    
    valor_actual = models.TextField(
        null=True,
        blank=True,
        db_column='valor_actual',
        help_text="Valor actual del campo"
    )
    
    solicitante = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='solicitudes_realizadas',
        db_column='solicitante_id'
    )
    
    supervisor = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='solicitudes_por_revisar',
        db_column='supervisor_id',
        help_text="Usuario que debe autorizar la solicitud"
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pendiente',
        db_column='estado'
    )
    
    fecha_solicitud = models.DateTimeField(
        auto_now_add=True,
        db_column='fecha_solicitud'
    )

    class Meta:
        db_table = 'solicitudes_autorizacion'
        ordering = ['-fecha_solicitud']
        verbose_name = "Solicitud de Autorización"
        verbose_name_plural = "Solicitudes de Autorización"
        # Reemplazamos el constraint condicional por un índice compuesto
        indexes = [
            models.Index(fields=['bitacora', 'campo_id', 'solicitante', 'estado'],
                        name='idx_solicitud_estado')
        ]

    def __str__(self):
        return f"Solicitud #{self.id_solicitud} - {self.campo_nombre} ({self.estado})"

    def save(self, *args, **kwargs):
        """
        Sobrescribimos el método save para implementar la lógica de unicidad
        que no podemos hacer con constraints en MariaDB
        """
        if self.estado == 'pendiente':
            # Verificar si ya existe una solicitud pendiente para la misma combinación
            existing = SolicitudAutorizacion.objects.filter(
                bitacora=self.bitacora,
                campo_id=self.campo_id,
                solicitante=self.solicitante,
                estado='pendiente'
            ).exclude(pk=self.pk).exists()
            
            if existing:
                raise ValueError('Ya existe una solicitud pendiente para este campo')
        
        super().save(*args, **kwargs)


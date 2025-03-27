from django import forms
from .models import (
    DilucionesEmpleadas, Direct_o_Dilucion, Dilucion,
    ControlCalidad, VerificacionBalanza, bita_cbap, DatosCampoCbap, ClaveMuestraCbap, Resultado, Bitcoras_Cbap, tableBlanco
)

from .models import DilucionesEmpleadas

class DilucionesEmpleadasForm(forms.ModelForm):
    class Meta:
        model = DilucionesEmpleadas
        fields = ['dE_1', 'dE_2', 'dE_3', 'dE_4']
        widgets = {
            'dE_1': forms.NumberInput(attrs={'step': '0.1', 'min': '0'}),
            'dE_2': forms.NumberInput(attrs={'step': '0.01', 'min': '0'}),
            'dE_3': forms.NumberInput(attrs={'step': '0.001', 'min': '0'}),
            'dE_4': forms.NumberInput(attrs={'step': '0.001', 'min': '0'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        for field in ['dE_1', 'dE_2', 'dE_3', 'dE_4']:
            value = cleaned_data.get(field)
            if value is not None:
                try:
                    cleaned_data[field] = float(value)
                except ValueError:
                    self.add_error(field, "Por favor ingresa un número válido.")
        return cleaned_data

    def clean(self):
        cleaned_data = super().clean()
        
        # Limpieza y validación adicional si es necesaria
        for field in ['dE_1', 'dE_2', 'dE_3', 'dE_4']:
            value = cleaned_data.get(field)
            if value is not None:
                try:
                    # Asegurarte de que el valor es un float
                    cleaned_data[field] = float(value)
                except ValueError:
                    self.add_error(field, "Por favor ingresa un número válido.")


# Formulario para Direct_o_Dilucion
class DirectODilucionForm(forms.ModelForm):
    class Meta:
        model = Direct_o_Dilucion
        fields = ['placa_dD', 'placa_dD2', 'promedio_dD']

# Formulario para Dilucion
class DilucionForm(forms.ModelForm):
    class Meta:
        model = Dilucion
        fields = ['placa_d', 'placa_d2', 'promedio_d', 'placa_d_2', 'placa_d2_2', 'promedio_d_2']
        # Formulario para Dilucion
# Formulario para Dilucion
class Dilucion2Form(forms.ModelForm):
    class Meta:
        model = Dilucion
        fields = ['placa_d', 'placa_d2', 'promedio_d']
# Formulario para ControlCalidad
class ControlCalidadForm(forms.ModelForm):
    class Meta:
        model = ControlCalidad
        fields = ['nombre_laf','fecha_1cc', 'page_1cc']
# class ControlCalidadForm(forms.ModelForm):
#     class Meta:
#         model = ControlCalidad
#         fields = ['laf_1','fecha_1cc', 'page_1cc', 'laf_2','fecha_2cc','page_2cc','laf_3', 'fecha_3cc','page_3cc','laf_4','fecha_4cc','page_4cc']

# Formulario para VerificacionBalanza
class VerificacionBalanzaForm(forms.ModelForm):
    class Meta:
        model = VerificacionBalanza
        fields = [
            'hora_vb', 'actividad_vb', 'ajuste_vb', 'valor_nominal_vb', 
            'valor_convencional_vb', 'valo_masa_vb', 'diferecnia_vb', 
            'incertidumbre_vb', 'emt_vb', 'aceptacion_vb', 'valor_pesado_muestra_vb'
        ]

class DatosCampoCbapForm(forms.ModelForm):
    class Meta:
        model = DatosCampoCbap
        fields = [
            'fecha_siembra_dc', 'hora_siembra_dc', 'hora_incubacion_dc', 
            'procedimiento_dc', 'equipo_incubacion_dc'
        ]
class ClaveMuestraCbapForm(forms.ModelForm):
    class Meta:
        model = ClaveMuestraCbap
        fields = ['clave_c_m','medicion_c_m', 'cantidad_c_m',]
class ResultadoCbapForm(forms.ModelForm):
    class Meta:
        model = Resultado
        fields = ['resultado_r','ufC_placa_r','diferencia_r']
# Formulario para BitaCbap
class BitaCbapForm(forms.ModelForm):
    class Meta:
        model = bita_cbap
        fields = [
            'nombre_cbap', 'pagina_cbap', 'letra_analista_cbap', 
            'mes_muestra_cbap', 'pagina_muestra_cbap', 'pagina_fosfato_cbap', 
            'numero_fosfato_cbap', 'pagina_agar_cbap', 'numero_agar_cbap', 
            'fecha_lectura_cbap', 'hora_lectura_cbap', 'observaciones_cbap'
        ]
class BitcorasCbapForm(forms.ModelForm):
    class Meta:
        model = Bitcoras_Cbap
        fields = ['name_user_cbap', 'nombre_bita_cbap']
        
class BlancosForm(forms.ModelForm):
    class Meta:
        model = tableBlanco
        fields = ['cantidad_blanco', 'placa_blanco', 'resultado_blanco']
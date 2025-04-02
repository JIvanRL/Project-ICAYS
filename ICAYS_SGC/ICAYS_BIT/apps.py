from django.apps import AppConfig


class IcaysBitConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ICAYS_BIT'
    def ready(self):
        import ICAYS_BIT.signals  # Importar señales cuando la aplicación esté lista

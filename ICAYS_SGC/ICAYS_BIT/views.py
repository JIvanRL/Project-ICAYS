from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from login.views import role_required

@login_required
@role_required('Analista')
def vistaAnalista(request):
  return render(request, 'microbiologyll.html')

@login_required
@role_required('Analista')
def bitacoras(request):
  return render(request, 'typeBitacoras.html')

@login_required
@role_required('Analista')
def analiticas(request):
  return render(request, 'VistaAnaliticas.html')

@login_required
@role_required('Analista')
def paginasNo(request):
  return render(request, 'trabajando.html')

@login_required
@role_required('Analista')
def cuentademohosylevaduras(request):
  return render(request, 'FP133.html')

def registerNewBita(request):
  return render(request, 'registerBita.html')
  
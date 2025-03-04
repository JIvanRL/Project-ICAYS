from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from login.views import role_required


@login_required
@role_required('Jefe Directo')
def inicioJD(request):
  return render(request, 'inicioJD.html')
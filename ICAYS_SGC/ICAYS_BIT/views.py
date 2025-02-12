from django.http import HttpResponse
from django.template import loader
from django.shortcuts import render

def app(request):
  template = loader.get_template('accounts/login.html')
  return HttpResponse(template.render())

def microbiologyll(request):
  return render(request, 'areas/microbiologyll/microbiologyll.html')
def registerNewBita(request):
  return render(request, 'areas/microbiologyll/views/registerBita.html')

  
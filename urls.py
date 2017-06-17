from django.conf.urls import patterns, include, url
from django.views.i18n import javascript_catalog
from django.contrib import admin
admin.autodiscover()

js_info_dict = { 
	'domain': 'django', 
	'packages': ('openshift',), 
}


urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'views.home', name='home'),
    url(r'^result/', 'views.result', name='result'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^i18n/', include('django.conf.urls.i18n')),
    url(r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),
)
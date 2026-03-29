# tenders/admin.py
from django.contrib import admin
from .models import User, Sheet, Position, Document, Comment, Lot

admin.site.register(User)
admin.site.register(Sheet)
admin.site.register(Position)
admin.site.register(Document)
admin.site.register(Comment)
admin.site.register(Lot)
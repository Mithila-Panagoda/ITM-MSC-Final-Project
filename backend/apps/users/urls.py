from .views import UserViewSet
from rest_framework_nested import routers

router = routers.SimpleRouter()
router.register('users', UserViewSet, 'user')

urlpatterns = router.urls
from drf_yasg.inspectors import SwaggerAutoSchema
class SwaggerAutoSchema(SwaggerAutoSchema):
    def get_tags(self, operation_keys=None):
       tags = self.overrides.get('tags',None) or getattr(self.view, 'tags', [])
       if not tags:
           tags = [operation_keys[0]]
       return tags
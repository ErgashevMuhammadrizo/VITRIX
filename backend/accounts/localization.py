import json
from pathlib import Path
from django.utils.translation import get_language

CATALOGUE = json.loads(Path(__file__).with_name('locales.json').read_text(encoding='utf-8'))

def translate(text, language=None):
    lang=(language or get_language() or 'uz').split('-')[0]
    if lang=='uz' or not isinstance(text,str):
        return text
    value=CATALOGUE.get(' '.join(text.split()))
    return value.get(lang,text) if value else text

class JsonLocalizationMiddleware:
    def __init__(self,get_response):
        self.get_response=get_response
    def __call__(self,request):
        response=self.get_response(request)
        if request.path.startswith('/api/v1/') and response.get('Content-Type','').startswith('application/json'):
            try:
                data=json.loads(response.content)
                if isinstance(data,dict) and isinstance(data.get('detail'),str):
                    data['detail']=translate(data['detail'])
                    response.content=json.dumps(data,ensure_ascii=False).encode('utf-8')
                    response['Content-Length']=str(len(response.content))
            except (ValueError,AttributeError):
                pass
        return response

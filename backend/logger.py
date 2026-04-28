import logging 
import logging.handlers 

logging.basicConfig(
    level=logging.ERROR, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(), 
        logging.handlers.TimedRotatingFileHandler("logs/error.log", when="W0", interval=1, backupCount=2)
    ]
)

logging.getLogger("uvicorn").setLevel(logging.ERROR)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)                                                                                 
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)

#request logger
request_logger = logging.getLogger("requests")                                                                                             
request_logger.setLevel(logging.INFO)                                                                                                      
request_logger.propagate = False  
handler = logging.handlers.TimedRotatingFileHandler("logs/request.log", when="W0", interval=1, backupCount=2)                                                                                          
handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
request_logger.addHandler(handler)  

#frontend error logger 
frontend_logger = logging.getLogger("frontend")
frontend_logger.setLevel(logging.ERROR)  
frontend_logger.propagate = False 
handler = logging.handlers.TimedRotatingFileHandler("logs/frontend_error.log", when="W0", interval=1, backupCount=2)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
frontend_logger.addHandler(handler) 

#base error logger 
def get_logger(name): 
    return logging.getLogger(name) 


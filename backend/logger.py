import logging 

logging.basicConfig(
    level=logging.ERROR, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(), 
        logging.FileHandler("logs/error.log")
    ]
)

logging.getLogger("uvicorn").setLevel(logging.ERROR)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)                                                                                 
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)

#request logger
request_logger = logging.getLogger("requests")                                                                                             
request_logger.setLevel(logging.INFO)                                                                                                      
request_logger.propagate = False  
handler = logging.FileHandler("logs/request.log")                                                                                          
handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
request_logger.addHandler(handler)  

#base error logger 
def get_logger(name): 
    return logging.getLogger(name) 


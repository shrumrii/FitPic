import logging 

logging.basicConfig(
    level=logging.ERROR, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(), 
        logging.FileHandler("logs/error.log")
    ]
)

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


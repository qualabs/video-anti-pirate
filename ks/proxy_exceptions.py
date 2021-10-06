class ProxyException(Exception):
    status_code = 400
    message = ""

    def __str__(self):
        return "{}: {}".format(self.__class__.__name__, self.message)

    def __unicode__(self):
        return self.__str__()


class InvalidRequestException(ProxyException):
    status_code = 400

    def __init__(self):
        self.message = "Invalid request"


class BannedException(ProxyException):
    status_code = 451

    def __init__(self, *args, **kwargs):
        self.message = "User is banned"

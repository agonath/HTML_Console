import sys
import os
#
# CD Command
#
# Parameter: 
#           _param -> the comandline content
#           _result -> dictionary for results, must be dict{"info":[], "error":[]} 
#
# Returns:
#           nothing
#
async def cd(_param:str, result:dict):

    token :List[str]    = _param.split(" ");
    length :int         = len(token);

    # check for "cd.." or "cd .."
    try:
        match(length):

            # must be "cd.." -> walk upwards
            case 1:
                if(token[0] == "cd.."):
                    os.chdir(os.pardir)
                    result["info"].append(os.getcwd())
                    return

                else:
                    return  # a single "cd"

            # cd .. / cd . / cd <path>
            case _: # default case
                if(token[1] == ".." or token[1] == "."): # walk upwards / do nothing
                    os.chdir(os.pardir)
                    result["info"].append(os.getcwd())
                    return
                
                else:
                    os.chdir(_param[3:])
                    result["info"].append(os.getcwd())
                    return

    except(OSError) as error:
        result["error"].append(error.strerror)
        return



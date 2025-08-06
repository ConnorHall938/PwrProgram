import { v4 as uuidv4 } from 'uuid'
import { UnauthorizedException } from './errors/unauthorizederror'
let session_dictionary = {}

const getLoggedInUsers = () => Object.keys(session_dictionary).map(function (key) { return session_dictionary[key] })

export function create_session(user_id: number): string {
    if (getLoggedInUsers().includes(user_id)) {
        console.log("Warning: User is already logged in. Is this a mistake?")
        delete session_dictionary[user_id];
    }

    let session_uuid = uuidv4()
    session_dictionary[session_uuid] = user_id
    return session_uuid
}

export function get_user_from_request(req): number {
    let cookie_value = req.cookies['session_id']
    if (Object.keys(session_dictionary).includes(cookie_value)) {
        return session_dictionary[cookie_value]
    }
    else {
        throw new UnauthorizedException('Session ID does not exist');
    }
}
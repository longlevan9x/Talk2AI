import { EVENT_ACTION, EVENT_TYPE } from "./enum";

interface WindowEventData {
  type: EVENT_TYPE;
  action: EVENT_ACTION;
  payload?: any;
}
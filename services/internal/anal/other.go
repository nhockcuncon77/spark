package anal

type PackageEvents interface {
	SendEvent(event Events)
	SendError(fail_type Events, err error)
	SetProperty(property Properties, value any)
}

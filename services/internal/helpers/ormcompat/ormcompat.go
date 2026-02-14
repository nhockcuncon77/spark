// Package ormcompat adapts spark code to the current MelloB1989/karma orm API.
// karma's orm.Load now takes only (any), has no Close(), and GetByFieldEquals returns (any, error).
package ormcompat

import (
	"fmt"

	"github.com/MelloB1989/karma/orm"
)

// GetByFieldEqualsSlice runs GetByFieldEquals and returns a slice of T.
// The karma ORM returns (any, error); any is *[]T or []T.
func GetByFieldEqualsSlice[T any](o *orm.ORM, field string, value any) ([]T, error) {
	result, err := o.GetByFieldEquals(field, value)
	if err != nil {
		return nil, err
	}
	if p, ok := result.(*[]T); ok {
		return *p, nil
	}
	if s, ok := result.([]T); ok {
		return s, nil
	}
	return nil, fmt.Errorf("ormcompat: unexpected result type from GetByFieldEquals")
}

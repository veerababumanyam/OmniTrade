// Copyright (c) 2021-2026 Onur Cinar.
// The source code is provided under GNU AGPLv3 License.
// https://indicator

package helper_test

import (
	"testing"

	"indicator/v2/helper"
)

func TestPow(t *testing.T) {
	input := helper.SliceToChan([]int{2, 3, 5, 10})
	expected := helper.SliceToChan([]int{4, 9, 25, 100})

	actual := helper.Pow(input, 2)

	err := helper.CheckEquals(actual, expected)
	if err != nil {
		t.Fatal(err)
	}
}
